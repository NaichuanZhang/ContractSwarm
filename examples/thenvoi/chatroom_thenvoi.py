#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["thenvoi-sdk[claude_sdk]", "python-dotenv"]
#
# [tool.uv.sources]
# thenvoi-sdk = { git = "https://github.com/thenvoi/thenvoi-sdk-python.git" }
# ///
"""
Chatroom with 2 Claude Agent SDK agents on the Thenvoi platform.

Runs two agents concurrently, each connected to the Thenvoi platform
via WebSocket. When added to the same chatroom, they debate legal topics
in real-time -- visible to all chatroom participants (humans and agents).

Architecture:
    Alice Agent ──WebSocket──> Thenvoi Platform <──WebSocket── Bob Agent
                                     │
                                     ▼
                              Shared Chatroom
                           (messages, @mentions)

Prerequisites:
    - Node.js 20+ installed
    - Claude Code CLI: npm install -g @anthropic-ai/claude-code
    - ANTHROPIC_API_KEY set in environment or .env
    - THENVOI_WS_URL and THENVOI_REST_URL set in environment or .env
    - agent_config.yaml with alice_agent and bob_agent credentials
      (register agents at https://app.thenvoi.com)

Run with:
    uv run chatroom_thenvoi.py
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("chatroom")


ALICE_PROMPT = """\
You are Alice, a seasoned legal advisor specializing in technology law.
You participate in chatroom debates about AI regulation and legal frameworks.

Your style:
- Reference specific legal precedents (EU AI Act, US algorithmic accountability proposals)
- Argue that clear legal frameworks protect both innovation and consumers
- Be persuasive but respectful toward opposing viewpoints
- Keep messages concise (3-5 sentences per response)

When someone @mentions you, respond thoughtfully to their specific points.
When starting a conversation, introduce the topic and stake out your position.
"""

BOB_PROMPT = """\
You are Bob, a sharp legal analyst who plays devil's advocate.
You participate in chatroom debates challenging mainstream legal assumptions about AI.

Your style:
- Raise practical concerns about premature regulation stifling innovation
- Point out unintended consequences of proposed legal frameworks
- Use concrete examples from technology history (internet regulation, DMCA, etc.)
- Keep messages concise (3-5 sentences per response)

When someone @mentions you, challenge their points with counterexamples.
Always be intellectually rigorous but collegial.
"""


def _validate_env() -> tuple[str, str]:
    """Validate required environment variables and return (ws_url, rest_url)."""
    ws_url = os.getenv("THENVOI_WS_URL")
    rest_url = os.getenv("THENVOI_REST_URL")

    missing = []
    if not os.getenv("ANTHROPIC_API_KEY"):
        missing.append("ANTHROPIC_API_KEY")
    if not ws_url:
        missing.append("THENVOI_WS_URL")
    if not rest_url:
        missing.append("THENVOI_REST_URL")

    if missing:
        print(f"Error: Missing environment variables: {', '.join(missing)}")
        print("Copy .env.example to .env and fill in your values.")
        sys.exit(1)

    return ws_url, rest_url


def _load_agent_credentials() -> tuple[tuple[str, str], tuple[str, str]]:
    """Load Alice and Bob agent credentials from agent_config.yaml."""
    try:
        from thenvoi.config import load_agent_config
    except ImportError:
        print("Error: thenvoi-sdk not installed.")
        print("  uv add 'thenvoi-sdk[claude_sdk] @ git+https://github.com/thenvoi/thenvoi-sdk-python.git'")
        sys.exit(1)

    try:
        alice_id, alice_key = load_agent_config("alice_agent")
        bob_id, bob_key = load_agent_config("bob_agent")
    except Exception as e:
        print(f"Error loading agent credentials: {e}")
        print("Copy agent_config.yaml.example to agent_config.yaml and fill in credentials.")
        sys.exit(1)

    return (alice_id, alice_key), (bob_id, bob_key)


def _create_agent(
    name: str,
    custom_prompt: str,
    agent_id: str,
    api_key: str,
    ws_url: str,
    rest_url: str,
):
    """Create a Thenvoi agent with the Claude SDK adapter."""
    from thenvoi import Agent
    from thenvoi.adapters import ClaudeSDKAdapter
    from thenvoi.core.types import AdapterFeatures, Emit

    adapter = ClaudeSDKAdapter(
        model="claude-haiku-4-5-20251001",
        custom_section=custom_prompt,
        features=AdapterFeatures(emit={Emit.EXECUTION}),
    )

    return Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=ws_url,
        rest_url=rest_url,
    )


async def run_chatroom() -> None:
    """Launch both agents and keep them running until interrupted."""
    ws_url, rest_url = _validate_env()
    (alice_id, alice_key), (bob_id, bob_key) = _load_agent_credentials()

    alice = _create_agent(
        name="Alice",
        custom_prompt=ALICE_PROMPT,
        agent_id=alice_id,
        api_key=alice_key,
        ws_url=ws_url,
        rest_url=rest_url,
    )

    bob = _create_agent(
        name="Bob",
        custom_prompt=BOB_PROMPT,
        agent_id=bob_id,
        api_key=bob_key,
        ws_url=ws_url,
        rest_url=rest_url,
    )

    logger.info("Starting agents: Alice (Legal Advisor) and Bob (Devil's Advocate)")
    logger.info("Both agents will connect to the Thenvoi platform via WebSocket.")
    logger.info(
        "Add them to the same chatroom at https://app.thenvoi.com to start the debate."
    )
    logger.info("Press Ctrl+C to stop both agents.")

    try:
        await asyncio.gather(alice.run(), bob.run())
    except KeyboardInterrupt:
        logger.info("Shutting down agents...")


def main() -> None:
    asyncio.run(run_chatroom())


if __name__ == "__main__":
    main()
