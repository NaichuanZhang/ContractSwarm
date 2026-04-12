"""SQLite database access for the agent backend."""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from uuid import uuid4

DB_PATH = Path(__file__).resolve().parent.parent / "contract-swarm.db"


def get_connection() -> sqlite3.Connection:
    """Return a new connection with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def new_id() -> str:
    return str(uuid4())
