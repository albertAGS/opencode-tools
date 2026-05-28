import type { MemoryDatabase } from '../db/database.js';

export const listTopicsSchema = {};

export function createListTopicsHandler(db: MemoryDatabase) {
  return async () => {
    try {
      const topics = db.listTopics();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ topics }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  };
}
