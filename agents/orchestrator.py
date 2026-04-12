"""Swarm orchestrator — coordinates parallel agent analysis of contracts."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from db import get_connection, new_id
from pdf_extractor import extract_text
from result_parser import persist_result
from prompts import CONTRACT_AGENT_PROMPT, LAW_AGENT_PROMPT

logger = logging.getLogger("orchestrator")

MIDPAGE_API_KEY = os.getenv("MIDPAGE_API_KEY", "")
THENVOI_WS_URL = os.getenv("THENVOI_WS_URL", "wss://app.thenvoi.com/api/v1/socket/websocket")
THENVOI_REST_URL = os.getenv("THENVOI_REST_URL", "https://app.thenvoi.com")

# Truncate contract text to stay within token limits.
# Each contract appears ONLY in the moderator prompt (not duplicated in subagent defs).
MAX_CONTRACT_CHARS = 6000


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _save_message(
    conn,
    room_id: str,
    agent_name: str,
    message_type: str,
    content: str,
    metadata: dict | None = None,
) -> None:
    """Mirror an agent message to the database for the frontend to consume."""
    conn.execute(
        """INSERT INTO agent_messages (id, room_id, agent_name, message_type, content, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (new_id(), room_id, agent_name, message_type, content,
         json.dumps(metadata) if metadata else None, _now()),
    )
    conn.commit()


async def _analyze_contract_direct(
    contract_id: str,
    assessment_id: str,
    client_name: str,
    contract_text: str,
    vendor_description: str,
) -> None:
    """Analyze a contract using Claude Agent SDK with subagents."""
    from claude_agent_sdk import (
        query,
        ClaudeAgentOptions,
        AgentDefinition,
        AssistantMessage,
        ResultMessage,
        TextBlock,
    )

    conn = get_connection()

    # Create a room record for message tracking
    room_id = new_id()
    conn.execute(
        "INSERT INTO agent_rooms (id, contract_id, thenvoi_chat_id, status, created_at) VALUES (?, ?, ?, 'active', ?)",
        (room_id, contract_id, "direct-mode", _now()),
    )
    conn.commit()

    _save_message(conn, room_id, "Orchestrator", "text",
                  f"Starting analysis for client: {client_name}")

    # Subagent definitions — lightweight prompts, NO contract text embedded.
    # The moderator passes relevant context when it invokes them.
    contract_agent = AgentDefinition(
        description=(
            "ContractAgent: a contract analyst. Give it contract text and a vendor "
            "description, and it extracts restrictive clauses (data sharing, subprocessor, "
            "consent, data residency, exclusivity, confidentiality, liability, IP) "
            "and the contract's monetary value/fees. "
            "It returns a structured list of clauses with risk ratings, plus financial data."
        ),
        prompt=(
            "You are ContractAgent, a meticulous contract analyst.\n"
            "When given contract text and a vendor use case, extract ALL restrictive clauses.\n"
            "For each clause output: clause_type, section_ref, clause_text (exact quote), risk_level (high/medium/low).\n"
            "Also extract the total contract value as a numeric USD amount (contract_value) "
            "and a brief summary of payment terms (fee_description). "
            "Look for: annual fees, retainer amounts, total contract value, per-unit pricing, or any monetary figures.\n"
            "If no monetary information is found, set both to null.\n"
            "Be thorough. Keep your response concise.\n"
            "Sign as ContractAgent."
        ),
        tools=[],
        model="haiku",
    )

    law_agent = AgentDefinition(
        description=(
            "LawAgent: a US legal researcher. Give it a list of contract clauses and a vendor "
            "use case, and it identifies applicable US federal and state laws, regulations, "
            "and case precedents. It returns legal analysis per clause with US citations."
        ),
        prompt=(
            "You are LawAgent, a legal researcher specializing in US federal and state law.\n"
            "When given contract clauses, identify relevant US laws, regulations, and case precedents.\n"
            "For each clause assess: is it enforceable under US law? what US regulations apply? what's the legal risk?\n"
            "ONLY cite CCPA (e.g., §1798.140, §1798.100) and HIPAA (e.g., §164.502, §164.514).\n"
            "Do NOT cite any other laws — no GDPR, no FTC Act, no GLBA, no state privacy acts, no UCC.\n"
            "Keep your response concise. Sign as LawAgent."
        ),
        tools=[],
        model="haiku",
    )

    truncated_text = contract_text[:MAX_CONTRACT_CHARS]

    moderator_prompt = f"""You are orchestrating a contract compliance analysis using two specialist agents.

CLIENT: {client_name}
VENDOR: {vendor_description}

CONTRACT TEXT:
---
{truncated_text}
---

WORKFLOW — follow these steps exactly:

STEP 1: Invoke "contract_agent" with this prompt:
  "Analyze this contract for {client_name}. Extract all restrictive clauses relevant to onboarding a new vendor: {vendor_description}
  Also extract the total contract value (as a numeric USD amount) and a brief fee description from any fee/payment sections.

  CONTRACT TEXT:
  {truncated_text[:3000]}..."

  (Pass enough contract text for it to work with.)

STEP 2: Take the clauses from ContractAgent's response. Invoke "law_agent" with this prompt:
  "Research legal implications of these contract clauses for onboarding vendor: {vendor_description}

  CLAUSES FOUND:
  [paste ContractAgent's clause list here]"

STEP 3: Synthesize both agents' findings. Produce a FINAL JSON result in a ```json code block:

```json
{{
  "client_name": "{client_name}",
  "overall_risk": "high" or "medium" or "low",
  "recommendation": "eligible" or "ineligible" or "needs_amendment",
  "contract_value": 150000.00 or null,
  "fee_description": "brief description of fees/payment terms" or null,
  "clauses": [
    {{
      "clause_type": "data_sharing",
      "section_ref": "Section 3.1",
      "clause_text": "exact text from contract",
      "risk_level": "high",
      "violations": [
        {{
          "severity": "critical" or "major" or "minor",
          "explanation": "plain language explanation",
          "legal_ref": {{
            "citation": "CCPA §1798.140",
            "case_name": "Relevant US case or regulation",
            "court_name": "US Court or federal/state regulatory body",
            "relevance": "why this applies"
          }},
          "original_language": "current clause text",
          "proposed_amendment": "suggested new language",
          "legal_justification": "why this fixes the issue"
        }}
      ]
    }}
  ]
}}
```

CRITICAL RULES:
- You MUST use the Agent tool to invoke "contract_agent" and "law_agent"
- You MUST end with a ```json code block containing the final result
- Include clauses with violations ONLY if genuine conflicts exist between the contract terms and the vendor use case under CCPA or HIPAA
- If no genuine violations exist, return empty violations arrays for each clause, set overall_risk to "low", and set recommendation to "eligible"
- Do NOT fabricate or exaggerate violations — accuracy is more important than finding problems
- ONLY cite CCPA and HIPAA — no other laws
- Do NOT cite GDPR, EU directives, or any non-US law
- The JSON must be valid and complete"""

    # No MCP servers on the moderator — keeps the CLI invocation simple and fast.
    # Subagents also have no MCP tools — they reason from their training data.
    options = ClaudeAgentOptions(
        model="haiku",
        system_prompt=(
            "You are a contract compliance orchestrator. "
            "Use the Agent tool to invoke contract_agent and law_agent subagents. "
            "Follow the workflow steps exactly. End with a JSON result."
        ),
        allowed_tools=["Agent"],
        agents={"contract_agent": contract_agent, "law_agent": law_agent},
        permission_mode="bypassPermissions",
    )

    final_text = ""
    try:
        async for message in query(prompt=moderator_prompt, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock) and block.text:
                        _save_message(conn, room_id, "Orchestrator", "text", block.text)
                        final_text += block.text + "\n"

            if isinstance(message, ResultMessage):
                if message.subtype == "success" and message.result:
                    final_text += str(message.result)
                cost = getattr(message, "total_cost_usd", 0) or 0
                _save_message(conn, room_id, "Orchestrator", "text",
                              f"Analysis complete. Cost: ${cost:.4f}")
    except Exception as e:
        logger.error(f"Agent error for {client_name}: {e}")
        _save_message(conn, room_id, "Orchestrator", "error", str(e))
        conn.execute("UPDATE contracts SET status = 'failed' WHERE id = ?", (contract_id,))
        conn.commit()
        conn.close()
        return

    # Parse and persist the structured result
    success = persist_result(conn, contract_id, assessment_id, final_text)
    if not success:
        logger.warning(f"Could not parse structured result for {client_name}")
        conn.execute(
            "UPDATE contracts SET status = 'completed', risk_score = 'medium', recommendation = 'needs_amendment' WHERE id = ?",
            (contract_id,),
        )
        conn.commit()

    _save_message(conn, room_id, "Orchestrator", "text", "Analysis saved to database.")
    conn.close()


async def run_assessment(assessment_id: str) -> None:
    """Run the full swarm analysis for an assessment."""
    conn = get_connection()

    # Mark assessment as running
    conn.execute(
        "UPDATE assessments SET status = 'running' WHERE id = ?",
        (assessment_id,),
    )
    conn.commit()

    # Load contracts
    rows = conn.execute(
        "SELECT id, client_name, file_name, file_path FROM contracts WHERE assessment_id = ?",
        (assessment_id,),
    ).fetchall()

    assessment = conn.execute(
        "SELECT vendor_name, vendor_description FROM assessments WHERE id = ?",
        (assessment_id,),
    ).fetchone()

    if not assessment:
        logger.error(f"Assessment {assessment_id} not found")
        return

    vendor_description = f"{assessment['vendor_name']}: {assessment['vendor_description']}"

    # Extract text from all PDFs
    logger.info(f"Extracting text from {len(rows)} contracts...")
    for row in rows:
        try:
            conn.execute(
                "UPDATE contracts SET status = 'extracting' WHERE id = ?",
                (row["id"],),
            )
            conn.commit()
            text = extract_text(row["file_path"])
            conn.execute(
                "UPDATE contracts SET raw_text = ?, status = 'analyzing' WHERE id = ?",
                (text, row["id"]),
            )
            conn.commit()
            logger.info(f"  Extracted {len(text)} chars from {row['file_name']}")
        except Exception as e:
            logger.error(f"  Failed to extract {row['file_name']}: {e}")
            conn.execute(
                "UPDATE contracts SET status = 'failed' WHERE id = ?",
                (row["id"],),
            )
            conn.commit()

    # Reload contracts with text
    contracts_with_text = conn.execute(
        "SELECT id, client_name, raw_text FROM contracts WHERE assessment_id = ? AND status = 'analyzing'",
        (assessment_id,),
    ).fetchall()

    conn.close()

    if not contracts_with_text:
        conn2 = get_connection()
        conn2.execute("UPDATE assessments SET status = 'failed' WHERE id = ?", (assessment_id,))
        conn2.commit()
        conn2.close()
        return

    # Analyze all contracts in parallel
    logger.info(f"Analyzing {len(contracts_with_text)} contracts in parallel...")
    tasks = [
        _analyze_contract_direct(
            contract_id=row["id"],
            assessment_id=assessment_id,
            client_name=row["client_name"],
            contract_text=row["raw_text"] or "",
            vendor_description=vendor_description,
        )
        for row in contracts_with_text
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"  Contract {contracts_with_text[i]['client_name']} raised: {result}")

    # Compute summary
    conn3 = get_connection()
    total = conn3.execute(
        "SELECT COUNT(*) as c FROM contracts WHERE assessment_id = ?",
        (assessment_id,),
    ).fetchone()["c"]

    eligible = conn3.execute(
        "SELECT COUNT(*) as c FROM contracts WHERE assessment_id = ? AND recommendation = 'eligible'",
        (assessment_id,),
    ).fetchone()["c"]

    conn3.execute(
        "UPDATE assessments SET status = 'completed', eligible_count = ?, total_count = ?, completed_at = ? WHERE id = ?",
        (eligible, total, _now(), assessment_id),
    )
    conn3.commit()
    conn3.close()

    logger.info(f"Assessment {assessment_id} complete: {eligible}/{total} eligible")
