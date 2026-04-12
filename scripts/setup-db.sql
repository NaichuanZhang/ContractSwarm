-- ContractSwarm SQLite Schema
-- Run: sqlite3 contract-swarm.db < scripts/setup-db.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assessments (
    id              TEXT PRIMARY KEY,
    vendor_name     TEXT NOT NULL,
    vendor_description TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    eligible_count  INTEGER,
    total_count     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS contracts (
    id              TEXT PRIMARY KEY,
    assessment_id   TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    client_name     TEXT NOT NULL,
    file_name       TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    raw_text        TEXT,
    risk_score      TEXT,
    recommendation  TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_rooms (
    id              TEXT PRIMARY KEY,
    contract_id     TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    thenvoi_chat_id TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id              TEXT PRIMARY KEY,
    room_id         TEXT NOT NULL REFERENCES agent_rooms(id) ON DELETE CASCADE,
    agent_name      TEXT NOT NULL,
    message_type    TEXT NOT NULL,
    content         TEXT NOT NULL,
    metadata        TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_room_time
    ON agent_messages(room_id, created_at);

CREATE TABLE IF NOT EXISTS clauses (
    id              TEXT PRIMARY KEY,
    contract_id     TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    clause_type     TEXT NOT NULL,
    section_ref     TEXT,
    clause_text     TEXT NOT NULL,
    risk_level      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS legal_refs (
    id              TEXT PRIMARY KEY,
    assessment_id   TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    citation        TEXT NOT NULL,
    case_name       TEXT NOT NULL,
    court_name      TEXT,
    opinion_id      TEXT,
    relevance       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS violations (
    id              TEXT PRIMARY KEY,
    clause_id       TEXT NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    legal_ref_id    TEXT REFERENCES legal_refs(id),
    severity        TEXT NOT NULL,
    explanation     TEXT NOT NULL,
    original_language TEXT,
    proposed_amendment TEXT,
    legal_justification TEXT,
    additional_docs  TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
