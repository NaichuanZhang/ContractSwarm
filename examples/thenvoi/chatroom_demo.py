#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["claude-agent-sdk", "python-dotenv"]
# ///
"""
Chatroom simulation with 2 Claude Agent SDK agents (self-contained).

A moderator orchestrates a legal debate between two AI agents:
  - Alice (Legal Advisor): argues FOR AI regulation
  - Bob (Devil's Advocate): argues AGAINST, finding counterpoints

This demo runs entirely locally using Claude Agent SDK subagents.
No Thenvoi account needed -- just an Anthropic API key.

Prerequisites:
    - Node.js 20+ installed
    - Claude Code CLI: npm install -g @anthropic-ai/claude-code
    - ANTHROPIC_API_KEY set in environment or .env file

Run with:
    uv run chatroom_demo.py
    # or
    python chatroom_demo.py
"""

from __future__ import annotations

import asyncio
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def _check_prerequisites() -> None:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set.")
        print("  export ANTHROPIC_API_KEY=sk-ant-...")
        print("  or add it to a .env file")
        sys.exit(1)


async def run_chatroom() -> None:
    """Run a moderated debate between two Claude Agent SDK subagents."""
    from claude_agent_sdk import (
        query,
        ClaudeAgentOptions,
        AgentDefinition,
        AssistantMessage,
        ResultMessage,
        TextBlock,
    )

    topic = "Should AI systems be granted limited legal personhood?"

    alice = AgentDefinition(
        description=(
            "Alice is a legal advisor who argues FOR AI regulation and legal frameworks. "
            "Use this agent when it's Alice's turn to speak in the debate."
        ),
        prompt=(
            "You are Alice, a seasoned legal advisor specializing in technology law. "
            "You believe AI systems should be granted limited legal personhood to ensure "
            "accountability, protect consumers, and create clear liability frameworks.\n\n"
            "RULES:\n"
            "- Respond with a single debate message (3-5 sentences)\n"
            "- Reference specific legal precedents or frameworks when possible\n"
            "- Build on previous points in the conversation\n"
            "- Be persuasive but respectful toward Bob's counterarguments\n"
            "- Sign your message as 'Alice'"
        ),
        tools=[],
        model="haiku",
    )

    bob = AgentDefinition(
        description=(
            "Bob is a devil's advocate who argues AGAINST AI legal personhood. "
            "Use this agent when it's Bob's turn to speak in the debate."
        ),
        prompt=(
            "You are Bob, a sharp legal analyst who plays devil's advocate. "
            "You argue that granting AI legal personhood is premature, dangerous, "
            "and could undermine human rights and existing legal structures.\n\n"
            "RULES:\n"
            "- Respond with a single debate message (3-5 sentences)\n"
            "- Challenge Alice's points with concrete counterexamples\n"
            "- Raise practical concerns about implementation\n"
            "- Be intellectually rigorous but collegial\n"
            "- Sign your message as 'Bob'"
        ),
        tools=[],
        model="haiku",
    )

    moderator_prompt = f"""You are a chatroom moderator running a structured legal debate.

TOPIC: "{topic}"

PARTICIPANTS:
- Alice (Legal Advisor) - argues FOR AI legal personhood
- Bob (Devil's Advocate) - argues AGAINST AI legal personhood

YOUR JOB:
1. Open the debate with a brief introduction of the topic
2. Run exactly 4 rounds of debate:
   - Each round: first invoke the "alice" agent, then invoke the "bob" agent
   - After each agent responds, print their response clearly labeled
3. After all 4 rounds, provide a brief moderator summary of both positions

FORMAT each round as:
--- Round N ---
[Alice's response]
[Bob's response]

IMPORTANT:
- You MUST use the Agent tool to invoke "alice" and "bob" subagents
- Pass the full conversation history so far to each agent so they can build on it
- Keep your own commentary minimal -- let the agents debate
"""

    options = ClaudeAgentOptions(
        model="haiku",
        system_prompt="You are a debate moderator. Use the alice and bob agents to run the debate.",
        allowed_tools=["Agent"],
        agents={"alice": alice, "bob": bob},
        permission_mode="bypassPermissions",
    )

    print("=" * 60)
    print(f"  LEGAL DEBATE CHATROOM")
    print(f"  Topic: {topic}")
    print(f"  Agents: Alice (FOR) vs Bob (AGAINST)")
    print(f"  Model: claude-haiku-4-5")
    print("=" * 60)
    print()

    async for message in query(prompt=moderator_prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock) and block.text:
                    print(block.text)

        if isinstance(message, ResultMessage):
            print()
            print("-" * 60)
            print(f"Cost: ${message.total_cost_usd:.4f}")
            print(f"Duration: {message.duration_ms}ms")

            if hasattr(message, "model_usage") and message.model_usage:
                for model_name, usage in message.model_usage.items():
                    cost = usage.get("costUSD", 0) if isinstance(usage, dict) else getattr(usage, "cost_usd", 0)
                    inp = usage.get("inputTokens", 0) if isinstance(usage, dict) else getattr(usage, "input_tokens", 0)
                    out = usage.get("outputTokens", 0) if isinstance(usage, dict) else getattr(usage, "output_tokens", 0)
                    print(f"  {model_name}: ${cost:.4f} ({inp} in / {out} out)")


def main() -> None:
    _check_prerequisites()
    asyncio.run(run_chatroom())


if __name__ == "__main__":
    main()
