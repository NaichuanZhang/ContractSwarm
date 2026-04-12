# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A hackathon demo: two Claude Agent SDK agents debating legal topics in a chatroom. Two entry points exist:

- **`chatroom_demo.py`** -- Self-contained. A moderator agent orchestrates two subagents (Alice, Bob) via Claude Agent SDK's `query()` + `AgentDefinition`. No external accounts needed.
- **`chatroom_thenvoi.py`** -- Production version. Two independent agents connect to the Thenvoi platform via WebSocket using `thenvoi-sdk[claude_sdk]`'s `ClaudeSDKAdapter`, communicating through a shared chatroom.

## Running

```bash
# Self-contained demo (just needs ANTHROPIC_API_KEY in .env)
uv run chatroom_demo.py

# Thenvoi platform version (needs agent credentials in agent_config.yaml)
uv run chatroom_thenvoi.py
```

Both scripts use inline script metadata (`# /// script`), so `uv run` handles dependency installation automatically.

## Architecture

### chatroom_demo.py (subagent pattern)
```
Moderator (haiku) ──Agent tool──> Alice subagent (haiku)
                  ──Agent tool──> Bob subagent (haiku)
```
Single `query()` call. The moderator uses `allowed_tools=["Agent"]` to invoke named subagents defined via the `agents={}` parameter. Subagents have empty `tools=[]` (pure conversation, no file/shell access).

### chatroom_thenvoi.py (platform pattern)
```
Alice Agent ──WebSocket──> Thenvoi Platform <──WebSocket── Bob Agent
                                  │
                                  ▼
                           Shared Chatroom
```
Two `Agent.create()` instances run concurrently via `asyncio.gather()`. Each uses `ClaudeSDKAdapter` which wraps Claude Agent SDK behind an MCP-based tool bridge. Agent credentials come from `agent_config.yaml` via `thenvoi.config.load_agent_config()`.

## Key Dependencies

- `claude-agent-sdk` -- Claude Agent SDK (requires Node.js 20+ and `@anthropic-ai/claude-code` CLI installed globally)
- `thenvoi-sdk[claude_sdk]` -- Thenvoi platform SDK with Claude adapter (optional, git dependency)
- `python-dotenv` -- Loads `.env` for API keys

## Model

Both demos use `haiku` (claude-haiku-4-5). In `chatroom_demo.py`, set via `ClaudeAgentOptions(model="haiku")` and `AgentDefinition(model="haiku")`. In `chatroom_thenvoi.py`, set via `ClaudeSDKAdapter(model="claude-haiku-4-5-20251001")`.
