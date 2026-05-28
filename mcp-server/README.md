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
