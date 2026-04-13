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

## Thenvoi Integration

ContractSwarm is built on [Thenvoi](https://app.thenvoi.com), a multi-agent communication platform that provides the real-time messaging infrastructure for agent coordination. Each contract analysis maps to a **Thenvoi chatroom** — agents connect via WebSocket, exchange findings through structured messages, and produce results visible to both humans and other agents in the same room.

```mermaid
graph TB
    subgraph "Thenvoi Platform"
        WS["WebSocket Gateway\nwss://app.thenvoi.com"]
        REST["REST API\nhttps://app.thenvoi.com"]
        CR1["Chatroom: Acme Corp MSA"]
        CR2["Chatroom: Globex DPA"]
        CRN["Chatroom: Initech Services"]
        WS --- CR1
        WS --- CR2
        WS --- CRN
    end

    subgraph "ContractSwarm Backend"
        ORC["Orchestrator\nasyncio.gather × N"]
        ORC -->|"Agent.create per team"| WS
        ORC -->|"Create chatroom"| REST
    end

    subgraph "Acme Corp Agent Team"
        M1[Moderator] -->|WebSocket| CR1
        C1[ContractAgent] -->|WebSocket| CR1
        L1[LawAgent] -->|WebSocket| CR1
    end

    subgraph "Globex Agent Team"
        M2[Moderator] -->|WebSocket| CR2
        C2[ContractAgent] -->|WebSocket| CR2
        L2[LawAgent] -->|WebSocket| CR2
    end

    UI["Next.js Frontend\nSSE Stream"] -.->|"Read agent messages"| REST

    style WS fill:#8B6F47,color:#fff
    style REST fill:#8B6F47,color:#fff
    style CR1 fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
    style CR2 fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
    style CRN fill:#F0EDE8,color:#1A1A1A,stroke:#E5E0DB
    style M1 fill:#8B6F47,color:#fff
    style C1 fill:#4A9E6E,color:#fff
    style L1 fill:#6B5CE7,color:#fff
    style M2 fill:#8B6F47,color:#fff
    style C2 fill:#4A9E6E,color:#fff
    style L2 fill:#6B5CE7,color:#fff
```

### Chatroom-per-Contract Pattern

Every contract analysis gets its own dedicated Thenvoi chatroom. The `agent_rooms` table stores the mapping via `thenvoi_chat_id`:

| Contract | Thenvoi Chatroom | Agents |
|----------|-----------------|--------|
| Acme Corp MSA | `chatroom-abc123` | Moderator, ContractAgent, LawAgent |
| Globex DPA | `chatroom-def456` | Moderator, ContractAgent, LawAgent |
| Initech Services | `chatroom-ghi789` | Moderator, ContractAgent, LawAgent |

This pattern means every agent conversation is **observable** — humans can join any chatroom on the Thenvoi platform to watch the analysis unfold in real-time, or review the full transcript after completion. Every message exchanged between agents is persisted to the `agent_messages` table and streamed to the frontend via SSE.

### SDK Usage

Agents connect to Thenvoi using `thenvoi-sdk[claude_sdk]`, which wraps Claude Agent SDK behind Thenvoi's adapter layer:

```python
from thenvoi import Agent
from thenvoi.adapters import ClaudeSDKAdapter
from thenvoi.core.types import AdapterFeatures, Emit

# Wrap Claude Agent SDK with Thenvoi's communication adapter
adapter = ClaudeSDKAdapter(
    model="claude-haiku-4-5-20251001",
    custom_section=agent_prompt,
    features=AdapterFeatures(emit={Emit.EXECUTION}),
)

# Create an agent connected to the Thenvoi platform
agent = Agent.create(
    adapter=adapter,
    agent_id=agent_id,        # Registered at app.thenvoi.com
    api_key=api_key,           # Per-agent API key
    ws_url="wss://app.thenvoi.com/api/v1/socket/websocket",
    rest_url="https://app.thenvoi.com",
)

# Agents run concurrently — each connected via its own WebSocket
await asyncio.gather(moderator.run(), contract_agent.run(), law_agent.run())
```

The `ClaudeSDKAdapter` bridges Claude Agent SDK's `query()` interface with Thenvoi's WebSocket messaging — agents reason with Claude while communicating through Thenvoi chatrooms. The `AdapterFeatures(emit={Emit.EXECUTION})` flag streams execution-level events (tool calls, subagent invocations) into the chatroom, making the full reasoning chain visible to observers.

### Dual Mode Operation

ContractSwarm supports two execution modes, ensuring the system works with or without a Thenvoi account:

| Mode | `thenvoi_chat_id` | Communication | Use Case |
|------|-------------------|---------------|----------|
| **Thenvoi Platform** | `chatroom-{uuid}` | Real WebSocket chatrooms | Production — full observability, human-in-the-loop |
| **Direct** | `"direct-mode"` | Claude Agent SDK `query()` + subagents | Development — no Thenvoi account needed |

Set `THENVOI_WS_URL` and `THENVOI_REST_URL` in your environment to enable platform mode. Without them, the system falls back to direct mode using Claude Agent SDK's native subagent pattern — same analysis, same results, but without the real-time chatroom observability that Thenvoi provides.

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

    O->>DB: Create agent_room (thenvoi_chat_id)
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
        text thenvoi_chat_id
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
└── examples/thenvoi/             # Reference implementations
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
