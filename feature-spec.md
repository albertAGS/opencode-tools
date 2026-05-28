# Feature: MCP Memory Server

## Overview

An MCP (Model Context Protocol) server that gives opencode persistent memory across sessions. Stores facts, decisions, and context in SQLite with full-text search via FTS5. Think lightweight Engram — but in TypeScript.

## Requirements

- [ ] 4 MCP tools: `remember`, `recall`, `forget`, `list_topics`
- [ ] Topics stored as JSON array of strings (e.g. `["angular", "architecture"]`)
- [ ] SQLite storage with FTS5 full-text search across content + topics_text
- [ ] stdio transport (standard MCP pattern)
- [ ] Configurable via `opencode.json` as a local MCP server
- [ ] Part of the `opencode-tools` monorepo at `mcp-server/`
- [ ] TypeScript, compiled to `dist/`

## Acceptance Criteria

- `remember(content, topics?)` stores a memory, returns `{ id, topics }`. Topics is an array, defaults to `["general"]`
- `recall(query?, topic?)` — content search (FTS5) and/or topic filter (via `json_each`)
- `forget(id)` deletes a memory, confirms deletion
- `list_topics()` returns all unique topics with memory count per topic
- Server starts via `node dist/index.js` with stdio transport
- `db/memories.db` is auto-created and gitignored

## Proposer Analysis

### Option A: Single-file server (Recommended)
**Description**: All logic in one `src/index.ts` file. Simple, minimal.

**Pros**:
- ~100-150 lines total
- Fastest to build
- Easy to understand and modify
- No over-engineering

**Cons**:
- Less scalable for future phases
- Mixes concerns (transport, tools, DB)

**Complexity**: Low

### Option B: Modular structure
**Description**: Split into `src/index.ts`, `src/tools/*.ts`, `src/db/database.ts`.

**Pros**:
- Clean separation of concerns
- Easy to add Phase 2 (schema reader) later
- Easier to test

**Cons**:
- More boilerplate upfront
- Slightly more complex

**Complexity**: Medium

### Option C: Express-based HTTP server
**Description**: Use Streamable HTTP transport instead of stdio.

**Pros**:
- Can run remotely
- Familiar Express patterns

**Cons**:
- Overkill for a local developer tool
- Requires port management
- More dependencies

**Complexity**: High

### Recommendation

**Option B** — modular structure. Phase 2 (schema reader) and Phase 3 (more tools) are planned, so the modular structure pays off quickly. It's still simple but ready to grow.

---

## Design Blueprint

### File Structure

```
opencode-tools/mcp-server/
  package.json
  tsconfig.json
  .gitignore
  src/
    index.ts              ← Entry: create McpServer, register tools, connect stdio transport
    tools/
      remember.ts         ← remember tool handler
      recall.ts           ← recall tool handler
      forget.ts           ← forget tool handler
      list-topics.ts      ← list_topics tool handler
    db/
      database.ts         ← SQLite init, FTS5 setup, CRUD operations
  db/
    memories.db           ← auto-created (gitignored)
  dist/                   ← compiled output (gitignored)
```

### Data Flow

```
opencode session
  │
  └── MCP Server (stdio transport)
        │
        └── Tool handler called by name
              │
              └── database.ts
                    └── better-sqlite3 → memories.db (SQLite + FTS5)
```

### Database Schema

```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topics TEXT NOT NULL DEFAULT '[]',         -- JSON array: ["angular", "architecture"]
  topics_text TEXT NOT NULL DEFAULT '',       -- flattened for FTS5 search
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE memories_fts USING fts5(content, topics_text, content=memories, content_rowid=id);

-- Triggers to keep FTS in sync
CREATE TRIGGER memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, topics_text) VALUES (new.id, new.content, new.topics_text);
END;

CREATE TRIGGER memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, topics_text) VALUES('delete', old.id, old.content, old.topics_text);
END;

CREATE TRIGGER memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, topics_text) VALUES('delete', old.id, old.content, old.topics_text);
  INSERT INTO memories_fts(rowid, content, topics_text) VALUES (new.id, new.content, new.topics_text);
END;
```

### Tool API Design

#### `remember`
- **Params**: `content` (string, required), `topics` (string[], optional — defaults to `["general"]`)
- **Returns**: `{ id: number, topics: string[] }`

#### `recall`
- **Params**: `query` (string, optional), `topic` (string, optional — filter by topic)
- **Returns**: `{ results: Array<{ id, topics, content, created_at, rank }> }`

#### `forget`
- **Params**: `id` (number, required)
- **Returns**: `{ deleted: boolean }`

#### `list_topics`
- **Params**: none
- **Returns**: `{ topics: Array<{ topic: string, count: number }> }`

### MCP SDK Usage (v1)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
```

Tools are registered via `setRequestHandler(ListToolsRequestSchema, ...)` for listing and `setRequestHandler(CallToolRequestSchema, ...)` for calling.

### Dependencies

- `@modelcontextprotocol/sdk` — v1.29.0 (stable)
- `better-sqlite3` — v12.10.0
- `typescript` — dev dependency
- `@types/better-sqlite3` — dev dependency

### Package.json scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### .gitignore

```
dist/
db/*.db
node_modules/
```

### States

**Loading**: Server starts, initializes SQLite + FTS5, registers tools, connects transport.

**Empty**: No memories stored — `recall` returns empty array, `list_topics` returns empty array.

**Error**: 
- Invalid params (missing `content`, non-numeric `id`) → return error message
- SQLite errors → return error message
- FTS5 query syntax errors → return error message

**Success**: Normal operation — tools return expected results.

## Usage Examples

```
@remember "We chose httpResource over HttpClient.subscribe() for type safety"
         topics: ["angular", "architecture", "signals"]
  → { id: 42, topics: ["angular", "architecture", "signals"] }

@recall topic: "angular"
  → [{ id: 42, topics: ["angular", "architecture", "signals"], content: "We chose httpResource over HttpClient...", rank: 0 }]

@recall "httpResource"
  → Same match — FTS5 finds it via content text

@recall "type safety" topic: "signals"
  → Filtered by topic + content search — only memories tagged "signals" matching "type safety"

@remember "Staging DB: postgres://staging.verba.cat:5432/verba"
         topics: ["devops", "config"]
  → { id: 43, topics: ["devops", "config"] }

@remember "Signup form has 3 validation states: idle, validating, error"
         topics: ["angular", "forms", "architecture"]
  → { id: 44, topics: ["angular", "forms", "architecture"] }

@list_topics
  → [{ topic: "angular", count: 2 },
      { topic: "architecture", count: 2 },
      { topic: "signals", count: 1 },
      { topic: "devops", count: 1 },
      { topic: "config", count: 1 },
      { topic: "forms", count: 1 },
      { topic: "general", count: 0 }]

@forget id: 42
  → { deleted: true }
```

### Good times to `@remember`

| Scenario | Topics | Why useful |
|---|---|---|
| You made an architecture decision | `["angular", "architecture"]` | Future sessions skip the debate |
| You found a breaking quirk in a library | `["workaround", "react"]` | Same bug won't waste time again |
| You set up a staging environment | `["devops", "config"]` | Connection details at your fingertips |
| You chose a library over another | `["decision", "signals"]` | Context for future trade-off discussions |
| You discovered a browser bug | `["bug", "css", "safari"]` | Save hours of re-debugging |

## Out of Scope

- Phase 2: Database schema reader (separate spec)
- Phase 3: Extended context tools (separate spec)
- Remote/HTTP transport (stdio only for now)
- Authentication or access control
- Team memory sync (future feature)
