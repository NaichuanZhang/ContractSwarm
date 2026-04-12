# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

ContractSwarm is an AI-powered vendor compliance tool. It deploys parallel AI agent swarms to analyze client contracts and determine whether a new third-party vendor can legally process each client's data. A Next.js frontend communicates with a Python FastAPI backend that orchestrates Claude Agent SDK subagents.

## Commands

```bash
# Frontend (from web/)
pnpm dev          # Start Next.js dev server on :3000
pnpm build        # Production build (also runs TypeScript checks)
pnpm lint         # ESLint

# Agent backend (from agents/)
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000   # Start orchestration API

# Database
sqlite3 contract-swarm.db < scripts/setup-db.sql  # Initialize/reset schema (from project root)

# Sample data
python scripts/generate-sample-contracts.py        # Generate 6 test PDFs in contracts/
```

Both servers must be running for end-to-end functionality. The frontend calls the Python backend at `AGENT_BACKEND_URL` (defaults to `http://localhost:8000`).

## Architecture

```
Next.js 16 App Router (web/)     Python FastAPI (agents/)
 ├─ /                             ├─ POST /orchestrate
 ├─ /assessment/[id]/swarm        │   └─ spawns thread per assessment
 ├─ /assessment/[id]/graph        ├─ orchestrator.py
 └─ /assessment/[id]/report       │   ├─ extracts PDF text (pdfplumber)
                                  │   ├─ creates agent rooms in DB
 API Routes:                      │   └─ runs 3 parallel query() calls
 ├─ /api/contracts (list PDFs)    │       ├─ Moderator (haiku)
 ├─ /api/assessments (CRUD)       │       │   ├─ ContractAgent subagent
 ├─ /api/assessments/[id]/stream  │       │   └─ LawAgent subagent
 ├─ /api/assessments/[id]/graph   │       └─ writes results to SQLite
 ├─ /api/assessments/[id]/report  └─ server.py (FastAPI + threading)
 └─ /api/assessments/[id]/export
```

**Shared SQLite database** at project root (`contract-swarm.db`). Both Next.js and Python read/write it. WAL mode enables concurrent access.

**Agent pattern**: Each contract gets a Claude Agent SDK `query()` call with a Moderator agent that invokes two subagents via the `Agent` tool — ContractAgent (clause extraction) and LawAgent (US legal research). All three run on `haiku`. The moderator produces a final JSON result that `result_parser.py` persists to the `clauses`, `legal_refs`, and `violations` tables.

**Real-time updates**: The `/api/assessments/[id]/stream` endpoint uses Server-Sent Events, polling `agent_messages` every 500ms. The swarm page consumes this via the `useEventSource` hook.

## Key Conventions

**LawAgent is US-only**: All legal citations must be CCPA and HIPAA only. All other laws (GDPR, FTC Act, GLBA, UCC, state privacy acts, non-US law) are explicitly prohibited in prompts.

**Design system**: Light theme. Gold accent (`#8B6F47`). Risk colors: high=`#DC3A2A`, medium=`#B8922E`, low=`#2D7A4A`. Background `#FAFAF8`, surface `#F0EDE8`, card `#FFFFFF`. Fonts: Playfair Display (headings), DM Sans (body), JetBrains Mono (code). Custom CSS tokens defined in `web/src/app/globals.css`.

**shadcn/ui uses Base UI** (not Radix). The Accordion has no `type` prop. Check `web/src/components/ui/` source before assuming Radix APIs.

**Next.js 16**: `params` is async (`Promise<{ id: string }>`). Use `const { id } = use(params)` in client components.

## Environment

**web/.env.local:**
- `AGENT_BACKEND_URL` — Python backend URL (default: `http://localhost:8000`)
- `CONTRACTS_DIR` — Path to PDF directory (default: `../contracts`)

**agents/.env:**
- `ANTHROPIC_API_KEY` — Required for Claude Agent SDK
- `MIDPAGE_API_KEY` — Midpage legal research API (optional, agents work without it)
- `THENVOI_WS_URL` / `THENVOI_REST_URL` — Thenvoi platform (optional, requires Enterprise plan for agent registration)

## Database Schema (SQLite)

7 tables. UUIDs generated in application code. Schema defined in `scripts/setup-db.sql` and mirrored in `web/src/lib/schema.ts` (Drizzle ORM).

- `assessments` — one per swarm run (vendor + status + counts)
- `contracts` — one per client PDF (linked to assessment, stores extracted text + risk/recommendation)
- `agent_rooms` — one per contract analysis (links to Thenvoi chat or "direct-mode")
- `agent_messages` — agent reasoning log (indexed by room_id + created_at)
- `clauses` — extracted contract clauses with type and risk level
- `legal_refs` — US case law citations from agent analysis
- `violations` — clause + legal_ref conflicts with severity and proposed amendments
