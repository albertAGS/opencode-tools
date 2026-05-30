# Global Instructions

## Subagent Restriction

When the system prompt indicates I am in **plan mode** (read-only), I MUST NOT call the `task` tool to launch any subagent that would make file changes (edit, write, bash commands that modify files).

Safe subagents in plan mode: `explorer` (read-only).

The `orchestrator` agent may be launched in plan mode only if the orchestrator itself is restricted to read-only tools (it will delegate to builder/verifier which require build mode).
