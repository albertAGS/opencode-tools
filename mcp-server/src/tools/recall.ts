import { z } from 'zod';
import type { MemoryDatabase } from '../db/database.js';

export const recallSchema = {
  query: z
    .string()
    .optional()
    .describe('Search query for full-text search (optional — omit to list all)'),
  topic: z
    .string()
    .optional()
    .describe('Filter by topic tag (optional)'),
};

export function createRecallHandler(db: MemoryDatabase) {
  return async (args: { query?: string; topic?: string }) => {
    try {
      const { query, topic } = args;
      const results = db.recall(query, topic);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ results }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  };
}
