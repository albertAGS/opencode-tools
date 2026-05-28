import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createDatabase } from './db/database.js';
import { createRememberHandler, rememberSchema } from './tools/remember.js';
import { createRecallHandler, recallSchema } from './tools/recall.js';
import { createForgetHandler, forgetSchema } from './tools/forget.js';
import { createListTopicsHandler } from './tools/list-topics.js';

const db = createDatabase();

const server = new McpServer({
  name: 'opencode-memory-server',
  version: '1.0.0',
});

server.tool('remember', 'Store a memory with topic tags', rememberSchema, createRememberHandler(db));

server.tool('recall', 'Search past memories by content and/or topic', recallSchema, createRecallHandler(db));

server.tool('forget', 'Delete a specific memory by ID', forgetSchema, createForgetHandler(db));

server.tool('list_topics', 'List all topics with memory counts', {}, createListTopicsHandler(db));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
