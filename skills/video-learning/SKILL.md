---
name: video-learning
description: Key concepts from 21 knowledge pills across 2 tutorial videos on AI agents, subagentes, Engram memory, SDD, and harness engineering. Load this skill then @recall specific pills for details.
license: MIT
compatibility: opencode
metadata:
  source: "Gentleman Programming YouTube"
  pills: "21"
  videos: "2"
---

# Video Learning — AI Agents, Memory & Harness Engineering

This skill indexes 21 timestamped knowledge pills across two videos. After loading this skill, use `@recall` to query specific concepts.

## How to use

```
@recall "pill-1"              → LLM fundamentals (4 min)
@recall "pill-6"              → Subagentes (2 min)
@recall "harness capas"       → 8 layers of a real harness
@recall topic: "video-1"      → All 14 pills from Tony Stark video
@recall topic: "engram"       → All pills about persistent memory
```

## Video 1: Cómo ser TONY STARK con IA (1h06m)

| Pill | Time | Topic |
|------|------|-------|
| 1 | 04:18–09:42 | ¿Qué es un LLM? Benchmarks y modelos actuales |
| 2 | 10:58–14:00 | Context Window y Compactación |
| 3 | 14:00–17:10 | RAG, Fine Tuning, Memory Layers |
| 4 | 17:28–20:12 | Chat vs Agente y Tools |
| 5 | 20:12–23:14 | Agents.md → Skills (Lazy Loading) |
| 6 | 23:14–25:55 | Subagentes: Divide y Vencerás |
| 7 | 25:55–33:39 | SDD: Spec Driven Development |
| 8 | 33:39–36:03 | MCP: Model Context Protocol |
| 9 | 36:03–39:04 | DAG: Explorer→Proposer→Designer→Spec→Implement→Verify |
| 10 | 39:04–40:49 | SDD Agent Teams Light library |
| 11 | 40:49–45:14 | Engram: señales no dumps, Go + SQLite + FTS5 |
| 12 | 45:14–55:20 | Engram demo + Git sync |
| 13 | 58:17–01:04:40 | Skills architecture: monorepo, meta-skills |
| 14 | 01:04:40–01:06:06 | Ecosystem: Engram + Router + Automation |

## Video 2: 20 Agent Harness

| Pill | Topic |
|------|-------|
| 15 | Harness Engineering: prompt → context → harness evolution |
| 16 | 8 capas de un harness real |
| 17 | Ralph Loop: automated coding agent loop |
| 18 | Superpowers (158k⭐): meta-configurator |
| 19 | GSD, BMAD, Spec-Kit, Archon, nWave |
| 20 | gentle-ai + Rita Vrataski Loop |
| 21 | Best practices: 5-15 tools, WIP=1, hooks, verify step |

## Quick reference

- **Engram** = persistent memory (SQLite + FTS5, signals not dumps) → our MCP server
- **SDD** = Spec Driven Development → our pipeline
- **Skills** = lazy-loading context → our skills dir
- **Harness** = everything around the model (tools, context, verify, permissions)
- **Subagentes** = isolated context per agent → our orchestrator pattern
- **Ralph Loop** = automated multi-session coding loop → future enhancement
