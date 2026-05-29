# opencode-tools

Reusable agents, skills, and configuration for [opencode](https://opencode.ai).

Stack-agnostic — works with Angular, React, NestJS, Go, Python, or any other stack. Each project's `AGENTS.md` provides the context the agents need.

## What's inside

```
opencode-tools/
  agents/          ← subagents available across all projects
    explorer.md     - research codebase before implementation (read-only)
    spec-writer.md  - create structured feature specs (asks clarifying questions)
    verifier.md     - run lint, typecheck, and tests after implementation
  skills/          ← reusable skill templates (add yours here)
  opencode.json    ← global opencode config
  package.json     ← plugin dependencies
  setup.sh         ← one-command install
```

## Install

### First time

```bash
git clone https://github.com/albertAGS/opencode-tools ~/opencode-tools
bash ~/opencode-tools/setup.sh
```

This will:

1. **Symlink `agents/`** → `~/.config/opencode/agents/` — agents are available in every opencode session. Run `git pull` to update them.
2. **Symlink `skills/`** → `~/.config/opencode/skills/` — ready for future skills.
3. **Copy config files** → `opencode.json`, `package.json` are copied (not symlinked) so you can add local overrides.
4. **Install dependencies** → runs `npm install` in `~/.config/opencode/`.

### Update

```bash
cd ~/opencode-tools && git pull && bash setup.sh
```

### New machine

```bash
git clone https://github.com/albertAGS/opencode-tools ~/opencode-tools
bash ~/opencode-tools/setup.sh
```

## Usage

Inside any opencode session, invoke agents with `@`:

```
@explorer "research how we handle HTTP calls and forms"
  → reads AGENTS.md, explores codebase, reports patterns

@spec-writer "create a spec for a contact form"
  → reads AGENTS.md, asks you questions, writes feature-spec.md

@verifier "verify the implementation"
  → runs lint + typecheck + tests, reports ✅/❌
```

## MCP Memory Server

A persistent memory server for opencode — stores facts, decisions, and context across sessions. See [feature-spec.md](feature-spec.md) for full details.

```bash
cd ~/opencode-tools/mcp-server && npm run build && npm start
```

### Usage

```
@remember "We chose httpResource over HttpClient.subscribe()"
         topics: ["angular", "architecture"]
  → { id: 42, topics: ["angular", "architecture"] }

@recall "httpResource"
  → Matches by content text (FTS5)

@recall topic: "angular"
  → All memories tagged "angular"

@list_topics
  → [{ topic: "angular", count: 5 }, { topic: "architecture", count: 2 }, ...]

@forget id: 42
  → { deleted: true }
```

Topics are JSON arrays — a memory can belong to multiple topics. Search by any of them.

## Memory agent tab

A dedicated **Memory** tab appears in your opencode session (switch with Tab). It has access to 4 MCP tools: `memory_remember`, `memory_recall`, `memory_forget`, `memory_list_topics`.

Use it to store project decisions, architecture choices, and learnings — they persist across sessions.

```
[Tab: Plan]  [Tab: Build]  [Tab: Memory]
                               ↑
                      "store that we chose httpResource"
                      "recall what we know about signals"
```

## Per-project setup

Each project should have an `AGENTS.md` that describes:

- Stack and framework
- Build, lint, test commands
- Code conventions and patterns
- Architecture decisions

The agents read this file to adapt to each project.

## Adding skills

Create a new folder under `skills/` with a `SKILL.md`:

```
skills/my-skill/SKILL.md
```

Frontmatter:

```markdown
---
name: my-skill
description: What this skill does and when to trigger it.
---

Skill instructions here...
```

Skills are auto-discovered by opencode. See [opencode docs](https://opencode.ai/docs/skills/) for more.
