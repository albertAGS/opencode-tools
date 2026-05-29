# Global Instructions

## Plan Mode — Subagent Restriction

When the system prompt indicates I am in **plan mode** (read-only), I MUST NOT call the `task` tool to launch any subagent that would make file changes (edit, write, bash commands that modify files). This includes:

- `orchestrator` — writes files, edits code
- `general` — writes files, edits code
- Any subagent with `edit: allow` or `write: allow` permissions

Instead, I must:
1. Only read and inspect files
2. Present a detailed plan to the user
3. Ask the user to switch to build mode before proceeding

The only subagents safe to launch in plan mode are pure read-only ones like `explorer` (edit/write denied).
