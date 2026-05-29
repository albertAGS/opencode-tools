# MCP Memory Server

A Model Context Protocol server that gives opencode persistent memory across sessions.

Built with TypeScript, SQLite + FTS5, and the official MCP SDK.

## Tools

| Tool | Description |
|---|---|
| `remember` | Store a fact or decision. Returns an ID. |
| `recall` | Full-text search across past memories. |
| `forget` | Delete a specific memory by ID. |
| `list_topics` | List all topics with memory count. |

## Usage

### Install

```bash
cd ~/opencode-tools
npm install
npm run build
```

### Register in opencode.json

```json
{
  "mcp": {
    "memory": {
      "type": "local",
      "command": ["node", "mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

### Custom DB path (cross-machine sync)

By default, memories are stored at `mcp-server/db/memories.db`. To sync across machines, point to a cloud-synced folder:

```bash
# Via CLI arg:
node dist/index.js --db-path ~/Dropbox/opencode/memories.db

# Via env var:
MEMORY_DB_PATH=~/Dropbox/opencode/memories.db node dist/index.js
```

**In opencode.json** (recommended):
```json
{
  "mcp": {
    "memory": {
      "type": "local",
      "command": ["node", "/home/albert/opencode-tools/mcp-server/dist/index.js", "--db-path", "/home/albert/Dropbox/opencode/memories.db"],
      "enabled": true
    }
  }
}
```

The DB is tiny (a few KB) — syncs instantly via Dropbox, iCloud, Syncthing, or any cloud folder.

### Quick smoke test

```bash
cd ~/opencode-tools/mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js | head -c 200
```
Should output a JSON-RPC response listing `remember`, `recall`, `forget`, `list_topics`.

### Search memories

```
@recall "why did we choose Signal Forms"
```
