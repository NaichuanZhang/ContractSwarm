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


async def _analyze_contract_with_thenvoi(
    contract_id: str,
    assessment_id: str,
    client_name: str,
    contract_text: str,
    vendor_description: str,
) -> None:
    """Analyze a single contract using Thenvoi agents in a shared room."""
    try:
        from thenvoi import Agent
        from thenvoi.adapters import ClaudeSDKAdapter
        from thenvoi.core.types import AdapterFeatures, Emit
        from thenvoi.config import load_agent_config
    except ImportError:
        logger.warning("Thenvoi SDK not available, falling back to direct mode")
        await _analyze_contract_direct(
            contract_id, assessment_id, client_name, contract_text, vendor_description
        )
        return

    conn = get_connection()

    # Create a room record (thenvoi_chat_id will be set by the platform)
    room_id = new_id()
    conn.execute(
        "INSERT INTO agent_rooms (id, contract_id, thenvoi_chat_id, status, created_at) VALUES (?, ?, ?, 'active', ?)",
        (room_id, contract_id, "pending", _now()),
    )
    conn.commit()

    _save_message(conn, room_id, "Orchestrator", "text",
                  f"Starting analysis for client: {client_name}")

    try:
        contract_agent_id, contract_agent_key = load_agent_config("contract_agent")
        law_agent_id, law_agent_key = load_agent_config("law_agent")
    except Exception as e:
        logger.error(f"Failed to load agent config: {e}")
        _save_message(conn, room_id, "Orchestrator", "error", f"Config error: {e}")
        await _analyze_contract_direct(
            contract_id, assessment_id, client_name, contract_text, vendor_description
        )
        return

    contract_adapter = ClaudeSDKAdapter(
        model="claude-haiku-4-5-20251001",
        custom_section=CONTRACT_AGENT_PROMPT + f"\n\nVENDOR USE CASE:\n{vendor_description}\n\nCONTRACT TEXT:\n{contract_text[:8000]}",
        features=AdapterFeatures(emit={Emit.EXECUTION}),
    )

    mcp_config = {}
    if MIDPAGE_API_KEY:
        mcp_config = {
            "midpage": {
                "type": "http",
                "url": "https://app.midpage.ai/mcp",
                "headers": {"Authorization": f"Bearer {MIDPAGE_API_KEY}"},
            }
        }

    law_adapter = ClaudeSDKAdapter(
        model="claude-haiku-4-5-20251001",
        custom_section=LAW_AGENT_PROMPT + f"\n\nVENDOR USE CASE:\n{vendor_description}",
        features=AdapterFeatures(emit={Emit.EXECUTION}),
        **({"mcp_servers": mcp_config, "allowed_tools": ["mcp__midpage__*"]} if mcp_config else {}),
    )

    contract_agent = Agent.create(
        adapter=contract_adapter,
        agent_id=contract_agent_id,
        api_key=contract_agent_key,
        ws_url=THENVOI_WS_URL,
        rest_url=THENVOI_REST_URL,
    )

    law_agent = Agent.create(
        adapter=law_adapter,
        agent_id=law_agent_id,
        api_key=law_agent_key,
        ws_url=THENVOI_WS_URL,
        rest_url=THENVOI_REST_URL,
    )

    _save_message(conn, room_id, "Orchestrator", "text", "Agents connected. Starting analysis...")

    try:
        await asyncio.gather(
            contract_agent.run(),
            law_agent.run(),
        )
    except Exception as e:
        logger.error(f"Thenvoi agent error for {client_name}: {e}")
        _save_message(conn, room_id, "Orchestrator", "error", f"Agent error: {e}")

    conn.close()


async def _analyze_contract_direct(
    contract_id: str,
    assessment_id: str,
    client_name: str,
    contract_text: str,
    vendor_description: str,
) -> None:
    """Fallback: analyze a contract using Claude Agent SDK directly (no Thenvoi)."""
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
                  f"Starting direct analysis for client: {client_name}")

    contract_agent = AgentDefinition(
        description="ContractAgent analyzes contract clauses for vendor compliance risks.",
        prompt=(
            CONTRACT_AGENT_PROMPT
            + f"\n\nVENDOR USE CASE:\n{vendor_description}"
            + f"\n\nCONTRACT TEXT (client: {client_name}):\n{contract_text[:8000]}"
        ),
        tools=[],
        model="haiku",
    )

    law_agent = AgentDefinition(
        description="LawAgent researches legal implications of contract clauses.",
        prompt=LAW_AGENT_PROMPT + f"\n\nVENDOR USE CASE:\n{vendor_description}",
        tools=[],
        model="haiku",
    )

    mcp_config = {}
    if MIDPAGE_API_KEY:
        mcp_config = {
            "midpage": {
                "type": "http",
                "url": "https://app.midpage.ai/mcp",
                "headers": {"Authorization": f"Bearer {MIDPAGE_API_KEY}"},
            }
        }

    moderator_prompt = f"""You are the Orchestrator coordinating a contract compliance analysis.

CLIENT: {client_name}
VENDOR USE CASE: {vendor_description}

CONTRACT TEXT (first 8000 chars):
{contract_text[:8000]}

YOUR JOB:
1. First, invoke the "contract_agent" to extract relevant clauses from the contract
2. Then, invoke the "law_agent" to research legal implications of those clauses
3. Then, invoke "contract_agent" again with the legal findings to produce the final assessment
4. Summarize the final structured JSON result

IMPORTANT:
- You MUST use the Agent tool to invoke agents
- Pass relevant context between agents
- The final output MUST include a JSON block with the ContractResult schema
"""

    options = ClaudeAgentOptions(
        model="haiku",
        system_prompt="You are a contract compliance orchestrator. Use agents to analyze contracts.",
        allowed_tools=["Agent"] + (["mcp__midpage__*"] if mcp_config else []),
        agents={"contract_agent": contract_agent, "law_agent": law_agent},
        permission_mode="bypassPermissions",
        **({"mcp_servers": mcp_config} if mcp_config else {}),
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
                _save_message(conn, room_id, "Orchestrator", "text",
                              f"Analysis complete. Cost: ${message.total_cost_usd:.4f}")
    except Exception as e:
        logger.error(f"Direct analysis error for {client_name}: {e}")
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

    await asyncio.gather(*tasks, return_exceptions=True)

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
