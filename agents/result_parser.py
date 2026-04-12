"""Parse structured JSON output from agents into database rows."""

from __future__ import annotations

import json
import re
import sqlite3

from models import ContractResult
from db import new_id


def extract_json_from_text(text: str) -> dict | None:
    """Extract JSON from agent output, handling markdown code blocks."""
    # Try extracting from ```json ... ``` blocks
    match = re.search(r"```json\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try extracting from ``` ... ``` blocks
    match = re.search(r"```\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try parsing the whole text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try finding a JSON object in the text
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def persist_result(
    conn: sqlite3.Connection,
    contract_id: str,
    assessment_id: str,
    raw_output: str,
) -> bool:
    """Parse agent output and write clauses, legal_refs, violations to DB.

    Returns True if parsing and persistence succeeded.
    """
    data = extract_json_from_text(raw_output)
    if data is None:
        return False

    try:
        result = ContractResult(**data)
    except Exception:
        return False

    now = _now()

    # Update contract with results
    conn.execute(
        "UPDATE contracts SET risk_score = ?, recommendation = ?, status = 'completed' WHERE id = ?",
        (result.overall_risk, result.recommendation, contract_id),
    )

    for clause in result.clauses:
        clause_id = new_id()
        conn.execute(
            """INSERT INTO clauses (id, contract_id, clause_type, section_ref, clause_text, risk_level, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (clause_id, contract_id, clause.clause_type, clause.section_ref,
             clause.clause_text, clause.risk_level, now),
        )

        for violation in clause.violations:
            legal_ref_id = None
            if violation.legal_ref:
                ref = violation.legal_ref
                legal_ref_id = new_id()
                conn.execute(
                    """INSERT INTO legal_refs (id, assessment_id, citation, case_name, court_name, opinion_id, relevance, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (legal_ref_id, assessment_id, ref.citation, ref.case_name,
                     ref.court_name, ref.opinion_id, ref.relevance, now),
                )

            violation_id = new_id()
            additional_docs_json = (
                json.dumps(violation.additional_docs) if violation.additional_docs else None
            )
            conn.execute(
                """INSERT INTO violations (id, clause_id, legal_ref_id, severity, explanation,
                   original_language, proposed_amendment, legal_justification, additional_docs, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (violation_id, clause_id, legal_ref_id, violation.severity,
                 violation.explanation, violation.original_language,
                 violation.proposed_amendment, violation.legal_justification,
                 additional_docs_json, now),
            )

    conn.commit()
    return True


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
