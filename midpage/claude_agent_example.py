"""Claude Agent SDK with midpage MCP server."""

import asyncio
import os

from dotenv import load_dotenv

load_dotenv()

from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

MIDPAGE_API_KEY = os.environ["MIDPAGE_API_KEY"]


async def run(prompt: str) -> str | None:
    options = ClaudeAgentOptions(
        model="claude-haiku-4-5-20251001",
        mcp_servers={
            "midpage": {
                "type": "http",
                "url": "https://app.midpage.ai/mcp",
                "headers": {"Authorization": f"Bearer {MIDPAGE_API_KEY}"},
            }
        },
        allowed_tools=["mcp__midpage__*"],
        system_prompt="You are a legal research assistant. Use midpage tools to search case law, find passages, and analyze opinions. Cite in Bluebook format.",
    )

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, ResultMessage) and message.subtype == "success":
            return message.result
    return None


if __name__ == "__main__":
    result = asyncio.run(run("Find Supreme Court cases about digital privacy"))
    print(result)
