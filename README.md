# ContractSwarm

**AI agents swarm your contracts so you don't have to.**

ContractSwarm is an AI-powered compliance tool that helps in-house lawyers assess whether they can legally onboard a new third-party vendor that will process their clients' data. It deploys a swarm of Claude AI agents to analyze every client contract in parallel — surfacing risks, violations, and draft amendments in minutes instead of weeks.

![ContractSwarm — Home Page](home-page.png)

![ContractSwarm — Agent Swarm analyzing contracts](swarm-page.png)

---

## How It Works

1. **Upload contracts** — Point to a directory of client contract PDFs
2. **Describe the vendor** — What does the vendor do? What data will it access? Where does it operate?
3. **Launch the swarm** — One agent team per contract, all analyzing in parallel
4. **Get results** — Per-client risk scores, violation reports, and ready-to-review contract amendments

---

## Architecture Overview

```mermaid
graph TB
    subgraph Browser
        A[Home Page<br/>Vendor Form + Contract List]
        B[Swarm View<br/>Live Agent Messages]
        C[Compliance Graph<br/>React Flow Visualization]
        D[Report View<br/>Violations + Amendments]
    end

    subgraph "Next.js 16 (web/)"
        E[API Routes]
        F[SSE Stream Endpoint]
        G[Drizzle ORM]
    end

    subgraph "Python FastAPI (agents/)"
        H[Orchestrator]
        I[PDF Extractor<br/>pdfplumber]
        J[Result Parser]
    end

    subgraph "Claude Agent SDK"
        K[Moderator Agent<br/>haiku]
        L[ContractAgent<br/>haiku]
        M[LawAgent<br/>haiku]
    end

    N[(SQLite DB<br/>WAL Mode)]

    A -->|POST /api/assessments| E
    E -->|INSERT assessments + contracts| N
    E -->|POST /orchestrate| H
    H --> I
    I -->|PDF → raw text| N
    H -->|asyncio.gather × N| K
    K -->|Agent tool| L
    K -->|Agent tool| M
    L -->|clause extraction| K
    M -->|US law citations| K
    K -->|final JSON| J
    J -->|INSERT clauses, violations, legal_refs| N
    F -->|poll every 500ms| N
    F -->|SSE events| B
    G -->|read| N
    G --> C
    G --> D

    style K fill:#8B6F47,color:#fff
    style L fill:#4A9E6E,color:#fff
    style M fill:#6B5CE7,color:#fff
    style N fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
```

---

## Data Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js Frontend
    participant API as Next.js API Routes
    participant DB as SQLite (WAL)
    participant PY as Python FastAPI
    participant SDK as Claude Agent SDK
    participant CA as ContractAgent
    participant LA as LawAgent

    User->>UI: Fill vendor form + click "Start Swarm"
    UI->>API: POST /api/assessments
    API->>DB: INSERT assessments (status=pending)
    API->>DB: INSERT contracts × N (status=pending)
    API->>PY: POST /orchestrate {assessment_id}
    API-->>UI: {id, status: "pending"}
    UI->>UI: router.push(/assessment/{id}/swarm)
    UI->>API: GET /api/assessments/{id}/stream (SSE)

    PY->>DB: UPDATE assessments SET status=running

    par Extract PDFs (sequential)
        PY->>DB: UPDATE contracts SET status=extracting
        PY->>PY: pdfplumber.open(file) → raw_text
        PY->>DB: UPDATE contracts SET raw_text, status=analyzing
    end

    par Analyze Contract 1
        PY->>SDK: query(moderator_prompt)
        SDK->>CA: "Extract clauses from contract..."
        CA-->>SDK: Clause list (data_sharing, subprocessor, etc.)
        SDK->>LA: "Research US legal implications..."
        LA-->>SDK: Citations (CCPA, HIPAA, FTC Act...)
        SDK-->>PY: Final JSON result
        PY->>DB: INSERT clauses, legal_refs, violations
        PY->>DB: UPDATE contracts SET status=completed
    and Analyze Contract 2
        PY->>SDK: query(moderator_prompt)
        SDK->>CA: "Extract clauses..."
        CA-->>SDK: Clause list
        SDK->>LA: "Research US law..."
        LA-->>SDK: Citations
        SDK-->>PY: Final JSON
        PY->>DB: INSERT clauses, legal_refs, violations
    and Analyze Contract N
        PY->>SDK: query(moderator_prompt)
        Note over SDK: Same pattern...
        SDK-->>PY: Final JSON
        PY->>DB: INSERT results
    end

    PY->>DB: UPDATE assessments SET status=completed

    loop Every 500ms
        API->>DB: SELECT new agent_messages
        API-->>UI: SSE event: message
    end
    API-->>UI: SSE event: status=completed

    User->>UI: Navigate to Graph / Report
    UI->>API: GET /api/assessments/{id}/graph
    API->>DB: SELECT contracts → clauses → violations → legal_refs
    API-->>UI: {nodes, edges}

    User->>UI: Export report
    UI->>API: GET /api/assessments/{id}/export
    API-->>User: JSON download
```

---

## Agent Swarm Architecture

```mermaid
graph LR
    subgraph "Per-Contract Room (× N parallel)"
        MOD[Moderator<br/>Orchestrates workflow]
        CA[ContractAgent<br/>Clause extraction]
        LA[LawAgent<br/>US legal research]

        MOD -->|"Step 1: Extract clauses"| CA
        CA -->|Clause list| MOD
        MOD -->|"Step 2: Research law"| LA
        LA -->|Citations + risk| MOD
        MOD -->|"Step 3: Synthesize"| MOD
    end

    PDF[Contract PDF] -->|pdfplumber| MOD
    MOD -->|Structured JSON| DB[(SQLite)]

    style MOD fill:#8B6F47,color:#fff
    style CA fill:#4A9E6E,color:#fff
    style LA fill:#6B5CE7,color:#fff
```

Each contract gets its own independent agent team. All teams run in parallel via `asyncio.gather()`. The Moderator invokes ContractAgent and LawAgent as subagents using Claude Agent SDK's `Agent` tool. All agents run on `claude-haiku-4-5`.

**ContractAgent** identifies restrictive clauses:
- Data sharing / subprocessor restrictions
- Consent requirements
- Data residency constraints
- Exclusivity / non-compete
- Confidentiality / liability / IP rights

**LawAgent** researches US law implications:
- CCPA/CPRA (Cal. Civ. Code §1798.100–§1798.199.100)
- HIPAA (45 C.F.R. Parts 160 and 164)
- Case law precedents via Midpage API
- No other laws are cited (GDPR, FTC Act, state privacy acts, UCC are explicitly excluded)

---

## Multi-Agent Orchestration

The swarm pattern runs N independent agent teams in true parallel — one team per contract, all executing concurrently via `asyncio.gather()`. Each team follows an identical 3-step workflow orchestrated by a Moderator agent.

### Parallel Execution Model

```mermaid
graph TB
    ORC["run_assessment()"] -->|"Load contracts from DB"| EXTRACT

    subgraph "Phase 1: PDF Extraction"
        EXTRACT["pdfplumber\n(sequential)"] -->|"raw_text → DB"| READY["All texts ready"]
    end

    READY -->|"asyncio.gather(×N)"| TEAM1
    READY -->|"asyncio.gather(×N)"| TEAM2
    READY -->|"asyncio.gather(×N)"| TEAMN

    subgraph "Phase 2: Parallel Analysis"
        subgraph "Team 1 — Acme Corp"
            TEAM1[Moderator] -->|Step 1| CA1[ContractAgent]
            CA1 -->|Clauses| TEAM1
            TEAM1 -->|Step 2| LA1[LawAgent]
            LA1 -->|Citations| TEAM1
            TEAM1 -->|Step 3| R1[JSON Result]
        end

        subgraph "Team 2 — Globex"
            TEAM2[Moderator] -->|Step 1| CA2[ContractAgent]
            CA2 -->|Clauses| TEAM2
            TEAM2 -->|Step 2| LA2[LawAgent]
            LA2 -->|Citations| TEAM2
            TEAM2 -->|Step 3| R2[JSON Result]
        end

        subgraph "Team N — Initech"
            TEAMN[Moderator] -->|Step 1| CAN[ContractAgent]
            CAN -->|Clauses| TEAMN
            TEAMN -->|Step 2| LAN[LawAgent]
            LAN -->|Citations| TEAMN
            TEAMN -->|Step 3| RN[JSON Result]
        end
    end

    R1 -->|persist_result| DB[(SQLite)]
    R2 -->|persist_result| DB
    RN -->|persist_result| DB

    style TEAM1 fill:#8B6F47,color:#fff
    style TEAM2 fill:#8B6F47,color:#fff
    style TEAMN fill:#8B6F47,color:#fff
    style CA1 fill:#4A9E6E,color:#fff
    style CA2 fill:#4A9E6E,color:#fff
    style CAN fill:#4A9E6E,color:#fff
    style LA1 fill:#6B5CE7,color:#fff
    style LA2 fill:#6B5CE7,color:#fff
    style LAN fill:#6B5CE7,color:#fff
    style DB fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
```

### 3-Agent Hierarchy

Each contract team is a self-contained unit with a strict hierarchy:

| Agent | Role | Model | Tools | Responsibilities |
|-------|------|-------|-------|-----------------|
| **Moderator** | Orchestrator | `claude-haiku-4-5` | `Agent` (invoke subagents) | Coordinates 3-step workflow, synthesizes final JSON result |
| **ContractAgent** | Specialist | `claude-haiku-4-5` | None (pure reasoning) | Clause extraction, risk rating, contract value identification |
| **LawAgent** | Specialist | `claude-haiku-4-5` | None (pure reasoning) | US legal research — CCPA + HIPAA only, case citations |

The Moderator is the only agent with tool access — it uses Claude Agent SDK's `Agent` tool to invoke the two specialists as subagents. Specialists have `tools=[]` (no file, shell, or MCP access), operating as pure reasoning agents that respond to the Moderator's prompts.

### Per-Contract Workflow

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant M as Moderator (haiku)
    participant CA as ContractAgent (haiku)
    participant LA as LawAgent (haiku)
    participant DB as SQLite

    O->>DB: Create agent_room
    O->>M: query(moderator_prompt + contract_text)

    rect rgb(74, 158, 110, 0.1)
        Note over M,CA: Step 1 — Clause Extraction
        M->>CA: "Analyze contract for {client}. Extract restrictive clauses for vendor: {desc}"
        CA-->>M: Structured clause list (type, section_ref, text, risk_level)
    end

    rect rgb(107, 92, 231, 0.1)
        Note over M,LA: Step 2 — Legal Research
        M->>LA: "Research legal implications. CLAUSES: {clause_list}"
        LA-->>M: US law citations per clause (CCPA §1798.x, HIPAA §164.x)
    end

    rect rgb(139, 111, 71, 0.1)
        Note over M: Step 3 — Synthesis
        M->>M: Cross-reference clauses with legal findings, generate final JSON
    end

    M-->>O: ResultMessage (structured JSON)
    O->>DB: persist_result → clauses, violations, legal_refs
    O->>DB: UPDATE contract SET status=completed

    loop During entire analysis
        O->>DB: INSERT agent_messages (real-time)
        Note over DB: SSE stream → frontend every 500ms
    end
```

### Claude Agent SDK Integration

The orchestrator uses Claude Agent SDK's core primitives to wire up the multi-agent system:

- **`ClaudeAgentOptions`** — configures the Moderator with `model="haiku"`, `allowed_tools=["Agent"]`, and `permission_mode="bypassPermissions"`
- **`AgentDefinition`** — defines each subagent with a `description` (used by the Agent tool for routing), a `prompt` (system instructions), and `model="haiku"`
- **`query()`** — async generator that streams `AssistantMessage` and `ResultMessage` events; each `TextBlock` is saved to `agent_messages` for the frontend SSE stream
- **`agents={}`** — the named subagent registry passed to the Moderator, enabling `Agent` tool invocations by name (`"contract_agent"`, `"law_agent"`)

Contract text is truncated to 6,000 characters and embedded only in the Moderator's prompt — subagent definitions stay lightweight. The Moderator passes relevant context when invoking each specialist, keeping token usage efficient across the 3-agent chain.

---

## Midpage Legal Research

ContractSwarm's LawAgent performs real-time US case law research through [Midpage](https://app.midpage.ai), a legal research API that provides semantic search over millions of US court opinions. Midpage is integrated as an **MCP (Model Context Protocol) server** — the agent connects to `https://app.midpage.ai/mcp` via streamable HTTP, giving it direct access to case law search, opinion analysis, and passage extraction tools without any custom HTTP plumbing.

```mermaid
graph LR
    subgraph "ContractSwarm Agent Team"
        MOD[Moderator] -->|"Step 2: Research law"| LA[LawAgent]
    end

    subgraph "Midpage Platform"
        MCP["MCP Server\nhttps://app.midpage.ai/mcp"]
        REST["REST API\nhttps://app.midpage.ai/api/v1"]
        DB_MP[("US Case Law\nOpinion Database")]
        MCP --> DB_MP
        REST --> DB_MP
    end

    LA -->|"mcp__midpage__search"| MCP
    LA -->|"mcp__midpage__findInOpinion"| MCP
    LA -->|"mcp__midpage__analyzeOpinion"| MCP

    MCP -->|"Citations + passages"| LA
    LA -->|"Legal analysis per clause"| MOD

    MOD -->|"persist_result()"| DB[(SQLite<br/>legal_refs table)]

    style LA fill:#6B5CE7,color:#fff
    style MOD fill:#8B6F47,color:#fff
    style MCP fill:#2D7A4A,color:#fff
    style REST fill:#2D7A4A,color:#fff
    style DB_MP fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
    style DB fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
```

### MCP Tools

Midpage exposes three tools through its MCP server. The LawAgent uses all three during a single contract analysis:

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| **`search`** | Semantic search over US case law | `queries[]` (1–4 parallel queries), `jurisdictionType`, `circuits[]`, `states[]`, `negativeQuery` |
| **`findInOpinion`** | Extract quotable passages from a specific opinion | `opinionId` or `reporterCitation` or `docket` + `query` |
| **`analyzeOpinion`** | AI-powered Q&A over an opinion document | Same ID params + `question` |

The LawAgent's typical workflow for a single clause:
1. **`search`** — find relevant case law for the clause type (e.g., data sharing restrictions under CCPA)
2. **`findInOpinion`** — extract the specific holding or passage from the most relevant opinion
3. **`analyzeOpinion`** — ask targeted questions about how the precedent applies to the vendor use case

### MCP Server Configuration

The Midpage MCP server is configured in Claude Agent SDK via `ClaudeAgentOptions`:

```python
from claude_agent_sdk import ClaudeAgentOptions, query

options = ClaudeAgentOptions(
    model="claude-haiku-4-5-20251001",
    mcp_servers={
        "midpage": {
            "type": "http",                              # Streamable HTTP transport
            "url": "https://app.midpage.ai/mcp",         # MCP endpoint
            "headers": {
                "Authorization": f"Bearer {MIDPAGE_API_KEY}"
            },
        }
    },
    allowed_tools=["mcp__midpage__*"],                   # Whitelist all Midpage tools
    system_prompt="You are a legal research assistant...",
)

async for message in query(prompt=research_prompt, options=options):
    # Agent autonomously calls search, findInOpinion, analyzeOpinion
    ...
```

The `"type": "http"` transport means the agent connects to Midpage's MCP server over HTTP — no sidecar process, no local installation. The `mcp__midpage__*` wildcard grants access to all three tools while keeping other tool namespaces locked down.

### REST API (Advanced)

For workflows that need direct control beyond what MCP exposes, ContractSwarm also integrates with Midpage's REST API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search` | `POST` | Full-text case law search with semantic, keyword, or hybrid modes |
| `/opinions/get` | `POST` | Retrieve opinion data by ID, Bluebook citation, or docket number |
| `/court/get` | `POST` | Look up court metadata by ID, abbreviation, or name |

The search endpoint supports advanced filtering — by court (`ca9`, `scotus`), jurisdiction (`Federal Appellate`), state, publish status, and date range — enabling precise queries like "CCPA enforcement actions in California federal courts since 2020."

```python
# Direct REST call for opinion retrieval with full HTML content
import httpx

response = httpx.post(
    "https://app.midpage.ai/api/v1/opinions/get",
    json={
        "citations": ["799 F.3d 236"],         # Bluebook citation lookup
        "include_content": True,                # Full opinion HTML
        "include_detailed_treatments": True,    # How other courts treated this opinion
    },
    headers={"Authorization": f"Bearer {MIDPAGE_API_KEY}"},
)

opinion = response.json()["opinions"][0]
# → case_name, court_id, citations[], citation_count, overall_treatment, html_content
```

### How Legal Research Flows Into Results

Every legal citation the LawAgent finds through Midpage is persisted to the `legal_refs` table and linked to specific violations:

```mermaid
sequenceDiagram
    participant LA as LawAgent
    participant MP as Midpage MCP
    participant DB as SQLite

    Note over LA: Received clauses from ContractAgent

    LA->>MP: search("data sharing restrictions CCPA")
    MP-->>LA: opinion_id: 7228818, case_name: "FTC v. Wyndham"

    LA->>MP: findInOpinion(opinionId: "7228818", query: "third-party data processor")
    MP-->>LA: "The FTC has authority to regulate unfair data practices..."

    LA->>MP: analyzeOpinion(opinionId: "7228818", question: "Does this apply to SaaS vendors?")
    MP-->>LA: "Yes — the court held that cloud service providers..."

    LA-->>LA: Synthesize findings into legal analysis

    Note over LA,DB: Results persisted via Moderator → result_parser

    LA->>DB: INSERT legal_refs (citation, case_name, court_name, opinion_id, relevance)
    LA->>DB: INSERT violations (clause_id, legal_ref_id, severity, explanation, proposed_amendment)
```

The `legal_refs` table stores the Midpage `opinion_id` alongside the Bluebook citation, enabling direct deep-links back to the full opinion on the Midpage platform. Each violation record references both the contract clause it applies to and the legal authority that supports it — creating a fully traceable chain from contract text to legal precedent.

| Field | Source | Example |
|-------|--------|---------|
| `citation` | Midpage search result | `CCPA §1798.140(v)` |
| `case_name` | Midpage opinion metadata | `FTC v. Wyndham Worldwide Corp.` |
| `court_name` | Midpage court lookup | `U.S. Court of Appeals for the Third Circuit` |
| `opinion_id` | Midpage opinion ID | `7228818` |
| `relevance` | LawAgent analysis | `Establishes FTC authority over data processor obligations` |

---

## Database Schema

```mermaid
erDiagram
    assessments ||--o{ contracts : "has many"
    assessments ||--o{ legal_refs : "has many"
    contracts ||--o| agent_rooms : "has one"
    contracts ||--o{ clauses : "has many"
    agent_rooms ||--o{ agent_messages : "has many"
    clauses ||--o{ violations : "has many"
    violations |o--o| legal_refs : "cites"

    assessments {
        text id PK
        text vendor_name
        text vendor_description
        text status "pending|running|completed|failed"
        int eligible_count
        int total_count
        text created_at
        text completed_at
    }

    contracts {
        text id PK
        text assessment_id FK
        text client_name
        text file_name
        text file_path
        text raw_text "extracted PDF content"
        text risk_score "high|medium|low"
        text recommendation "eligible|ineligible|needs_amendment"
        text status "pending|extracting|analyzing|completed|failed"
        text created_at
    }

    agent_rooms {
        text id PK
        text contract_id FK
        text chat_id
        text status
        text created_at
    }

    agent_messages {
        text id PK
        text room_id FK
        text agent_name "Orchestrator|ContractAgent|LawAgent"
        text message_type "text|error"
        text content
        text metadata "JSON"
        text created_at
    }

    clauses {
        text id PK
        text contract_id FK
        text clause_type "data_sharing|subprocessor|consent|..."
        text section_ref "Section 3.1"
        text clause_text
        text risk_level "high|medium|low"
        text created_at
    }

    legal_refs {
        text id PK
        text assessment_id FK
        text citation "CCPA s1798.140"
        text case_name
        text court_name
        text opinion_id
        text relevance
        text created_at
    }

    violations {
        text id PK
        text clause_id FK
        text legal_ref_id FK "nullable"
        text severity "critical|major|minor"
        text explanation
        text original_language
        text proposed_amendment
        text legal_justification
        text additional_docs "JSON array"
        text created_at
    }
```

---

## User Flow

```mermaid
stateDiagram-v2
    [*] --> HomePage: Open app

    HomePage --> HomePage: Scan contracts/ directory
    HomePage --> HomePage: Fill vendor name + description
    HomePage --> SwarmView: Click "Start Swarm"

    state SwarmView {
        [*] --> Connecting: SSE opens
        Connecting --> Streaming: First message arrives
        Streaming --> Streaming: Agent messages appear in rooms
        Streaming --> Complete: All contracts analyzed
    }

    SwarmView --> GraphView: Click "Compliance Graph" tab
    SwarmView --> ReportView: Click "Report" tab

    state GraphView {
        [*] --> LoadGraph: Fetch graph data
        LoadGraph --> Interactive: React Flow renders
        Interactive --> NodeDetail: Click any node
        NodeDetail --> Interactive: Close sidebar
    }

    state ReportView {
        [*] --> LoadReport: Fetch report data
        LoadReport --> ClientList: Accordion per client
        ClientList --> ViolationDetail: Expand client
        ViolationDetail --> ViolationDetail: View clause + citation + amendment
        ViolationDetail --> Export: Click "Export JSON"
    }

    GraphView --> SwarmView: Click "Swarm" tab
    GraphView --> ReportView: Click "Report" tab
    ReportView --> SwarmView: Click "Swarm" tab
    ReportView --> GraphView: Click "Graph" tab
    ReportView --> HomePage: Click "New Assessment"
    Export --> [*]
```

---

## Assessment Status Flow

```mermaid
stateDiagram-v2
    [*] --> pending: POST /api/assessments

    pending --> running: Orchestrator starts

    state running {
        [*] --> extracting: PDF text extraction
        extracting --> analyzing: Text extracted
        analyzing --> contract_done: Agent analysis complete
    }

    running --> completed: All contracts done
    running --> failed: Unrecoverable error
    extracting --> failed: PDF extraction error
    analyzing --> failed: Agent crash

    completed --> [*]
    failed --> [*]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Base UI), Framer Motion |
| Graph | React Flow (`@xyflow/react`) |
| Data Fetching | TanStack React Query, custom SSE hook |
| Backend API | Next.js Route Handlers |
| Agent Backend | Python 3.11+, FastAPI, Uvicorn |
| Agent SDK | Claude Agent SDK (`claude-agent-sdk`) |
| Legal Research | Midpage API (US case law search) |
| PDF Parsing | pdfplumber |
| Database | SQLite 3 (WAL mode), Drizzle ORM + aiosqlite |
| Fonts | Playfair Display, DM Sans, JetBrains Mono |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code`

### Setup

```bash
# Clone
git clone git@github.com:NaichuanZhang/ContractSwarm.git
cd ContractSwarm

# Initialize database
sqlite3 contract-swarm.db < scripts/setup-db.sql

# Generate sample contracts (optional)
python scripts/generate-sample-contracts.py

# Frontend
cd web
pnpm install
pnpm dev

# Agent backend (separate terminal)
cd agents
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn aiosqlite pdfplumber python-dotenv pydantic httpx claude-agent-sdk

# Configure API keys
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-...
MIDPAGE_API_KEY=ak_...
EOF

uvicorn server:app --host 0.0.0.0 --port 8000
```

### Usage

1. Place client contract PDFs in the `contracts/` directory
2. Open http://localhost:3000
3. Enter the vendor name and description
4. Click **Start Swarm** — watch agents work in real-time
5. Navigate to **Compliance Graph** for visual analysis
6. Navigate to **Report** for per-client violations and amendments
7. Click **Export** to download the full JSON report

---

## API Reference

### Next.js Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/contracts` | List PDF files from `contracts/` directory |
| `POST` | `/api/assessments` | Create assessment + trigger agent swarm |
| `GET` | `/api/assessments` | List all assessments |
| `GET` | `/api/assessments/[id]` | Assessment status + contract summaries |
| `GET` | `/api/assessments/[id]/rooms` | Agent rooms with contract mapping |
| `GET` | `/api/assessments/[id]/stream` | SSE stream of agent messages |
| `GET` | `/api/assessments/[id]/graph` | Graph nodes and edges for React Flow |
| `GET` | `/api/assessments/[id]/report` | Full nested report data |
| `GET` | `/api/assessments/[id]/export` | Downloadable JSON report |

### Python Backend

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/orchestrate` | Trigger swarm analysis (background thread) |

---

## Project Structure

```
contract-swarm/
├── contracts/                    # Client contract PDFs
├── agents/                       # Python agent backend
│   ├── server.py                 # FastAPI + threading orchestration
│   ├── orchestrator.py           # Parallel agent coordination
│   ├── prompts.py                # ContractAgent + LawAgent prompts
│   ├── result_parser.py          # Agent JSON → DB rows
│   ├── pdf_extractor.py          # PDF → text
│   ├── models.py                 # Pydantic models
│   └── db.py                     # SQLite connection
├── web/                          # Next.js 16 frontend
│   └── src/
│       ├── app/                  # Pages + API routes
│       ├── components/           # UI components
│       ├── hooks/                # useEventSource, useAssessment
│       └── lib/                  # db, schema, queries, types
├── scripts/
│   ├── setup-db.sql              # SQLite schema
│   └── generate-sample-contracts.py
└── examples/                     # Reference implementations
```

---

## Design System

Light theme with warm gold accents.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAFAF8` | Page background |
| `--card` | `#FFFFFF` | Card surfaces |
| `--surface` | `#F0EDE8` | Elevated surfaces |
| `--border` | `#E5E0DB` | Borders and dividers |
| `--foreground` | `#1A1A1A` | Primary text |
| `--gold` | `#8B6F47` | Primary accent |
| `--risk-high` | `#DC3A2A` | High risk / critical |
| `--risk-medium` | `#B8922E` | Medium risk / major |
| `--risk-low` | `#2D7A4A` | Low risk / compliant |

---

## License

Built for the Law + LLM Hackathon.
