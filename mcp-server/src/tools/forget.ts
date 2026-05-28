import { z } from 'zod';
import type { MemoryDatabase } from '../db/database.js';

export const forgetSchema = {
  id: z.number().int().positive().describe('The ID of the memory to delete'),
};

export function createForgetHandler(db: MemoryDatabase) {
  return async (args: { id: number }) => {
    try {
      const { id } = args;
      const deleted = db.forget(id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ deleted }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  };
}
