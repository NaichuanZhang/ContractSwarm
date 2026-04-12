"""Strands SDK agent with midpage MCP + REST tools."""

import os

import httpx
from mcp.client.streamable_http import streamablehttp_client
from strands import Agent, tool
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient

MIDPAGE_API_KEY = os.environ["MIDPAGE_API_KEY"]
MIDPAGE_BASE_URL = "https://app.midpage.ai/api/v1"


def _midpage_post(endpoint: str, payload: dict) -> dict:
    r = httpx.post(
        f"{MIDPAGE_BASE_URL}{endpoint}",
        json=payload,
        headers={"Authorization": f"Bearer {MIDPAGE_API_KEY}", "Content-Type": "application/json"},
        timeout=30.0,
    )
    r.raise_for_status()
    return r.json()


# REST tools (for endpoints MCP doesn't expose)

@tool
def get_opinion(opinion_ids: str = "", citations: str = "", include_content: bool = False) -> dict:
    """Retrieve opinion data by ID or Bluebook citation.

    Args:
        opinion_ids: Comma-separated opinion IDs, e.g. "7228818"
        citations: Comma-separated citations, e.g. "556 U.S. 662"
        include_content: Include full HTML text
    """
    if opinion_ids:
        payload = {"opinion_ids": [x.strip() for x in opinion_ids.split(",")], "include_content": include_content}
    elif citations:
        payload = {"citations": [x.strip() for x in citations.split(",")]}
    else:
        return {"error": "Provide opinion_ids or citations"}
    return _midpage_post("/opinions/get", payload)


@tool
def get_court_info(court_ids: str = "", names: str = "") -> dict:
    """Look up court metadata.

    Args:
        court_ids: Comma-separated court IDs, e.g. "ca9,scotus"
        names: Court name search, e.g. "Supreme Court"
    """
    if court_ids:
        payload = {"court_ids": [x.strip() for x in court_ids.split(",")]}
    elif names:
        payload = {"names": [x.strip() for x in names.split(",")]}
    else:
        return {"error": "Provide court_ids or names"}
    return _midpage_post("/court/get", payload)


# MCP client (provides: search, findInOpinion, analyzeOpinion)

mcp_client = MCPClient(
    lambda: streamablehttp_client(
        url="https://app.midpage.ai/mcp",
        headers={"Authorization": f"Bearer {MIDPAGE_API_KEY}"},
    )
)


def create_agent() -> Agent:
    os.environ.setdefault("AWS_PROFILE", "tokenmaster")
    return Agent(
        model=BedrockModel(model_id="us.anthropic.claude-sonnet-4-20250514-v1:0", max_tokens=8192),
        system_prompt="You are a legal research assistant. Use midpage tools to search case law, find passages, and analyze opinions. Cite in Bluebook format.",
        tools=[mcp_client, get_opinion, get_court_info],
    )


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    agent = create_agent()
    result = agent("Find Supreme Court cases about qualified immunity from the last 5 years")
