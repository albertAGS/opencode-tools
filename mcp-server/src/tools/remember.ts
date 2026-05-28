import { z } from 'zod';
import type { MemoryDatabase } from '../db/database.js';

export const rememberSchema = {
  content: z.string().min(1, 'content is required').describe('The memory content to store'),
  topics: z
    .array(z.string())
    .optional()
    .default(['general'])
    .describe('Topic tags to categorize this memory (default: ["general"])'),
};

export function createRememberHandler(db: MemoryDatabase) {
  return async (args: { content: string; topics?: string[] }) => {
    try {
      const { content } = args;
      const topics = args.topics ?? ['general'];
      const memory = db.remember(content, topics);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ id: memory.id, topics: memory.topics }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  };
}
