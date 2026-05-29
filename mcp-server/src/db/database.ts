import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', '..', 'db', 'memories.db');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface MemoryRecord {
  id: number;
  topics: string[];
  content: string;
  created_at: string;
}

interface MemoryRow {
  id: number;
  topics: string;
  content: string;
  created_at: string;
}

interface TopicCountRow {
  topic: string;
  count: number;
}

export function createDatabase(dbPath?: string) {
  const resolvedPath = dbPath || DEFAULT_DB_PATH;
  ensureDir(resolvedPath);
  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topics TEXT NOT NULL DEFAULT '[]',
      topics_text TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      content, topics_text,
      content=memories, content_rowid=id
    );

    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content, topics_text) VALUES (new.id, new.content, new.topics_text);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, topics_text) VALUES('delete', old.id, old.content, old.topics_text);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, topics_text) VALUES('delete', old.id, old.content, old.topics_text);
      INSERT INTO memories_fts(rowid, content, topics_text) VALUES (new.id, new.content, new.topics_text);
    END;
  `);

  const insertStmt = db.prepare(
    'INSERT INTO memories (content, topics, topics_text) VALUES (?, ?, ?)'
  );

  const deleteStmt = db.prepare('DELETE FROM memories WHERE id = ?');

  const getByIdStmt = db.prepare(
    'SELECT id, topics, content, created_at FROM memories WHERE id = ?'
  );

  const searchFtsStmt = db.prepare(`
    SELECT m.id, m.topics, m.content, m.created_at, f.rank
    FROM memories_fts f
    JOIN memories m ON m.id = f.rowid
    WHERE memories_fts MATCH ?
    ORDER BY f.rank
  `);

  const searchFtsWithTopicStmt = db.prepare(`
    SELECT m.id, m.topics, m.content, m.created_at, f.rank
    FROM memories_fts f
    JOIN memories m ON m.id = f.rowid
    CROSS JOIN json_each(m.topics) AS t
    WHERE memories_fts MATCH ? AND t.value = ?
    ORDER BY f.rank
  `);

  const listByTopicStmt = db.prepare(`
    SELECT DISTINCT m.id, m.topics, m.content, m.created_at
    FROM memories m, json_each(m.topics) AS t
    WHERE t.value = ?
    ORDER BY m.created_at DESC
  `);

  const listAllStmt = db.prepare(
    'SELECT id, topics, content, created_at FROM memories ORDER BY created_at DESC'
  );

  const listTopicsStmt = db.prepare(`
    SELECT t.value AS topic, COUNT(*) AS count
    FROM memories m, json_each(m.topics) AS t
    GROUP BY t.value
    ORDER BY count DESC, topic ASC
  `);

  function rowToRecord(row: MemoryRow): MemoryRecord {
    return {
      id: row.id,
      topics: JSON.parse(row.topics) as string[],
      content: row.content,
      created_at: row.created_at,
    };
  }

  return {
    remember(content: string, topics: string[] = ['general']): MemoryRecord {
      const topicsText = topics.join(' ');
      const topicsJson = JSON.stringify(topics);
      const info = insertStmt.run(content, topicsJson, topicsText);
      return {
        id: info.lastInsertRowid as number,
        topics,
        content,
        created_at: new Date().toISOString(),
      };
    },

    recall(query?: string, topic?: string): MemoryRecord[] {
      let rows: MemoryRow[];

      if (query && query.trim()) {
        const sanitized = query.trim().replace(/[^\w\s-]/g, '');
        if (topic && topic.trim()) {
          rows = searchFtsWithTopicStmt.all(sanitized, topic.trim()) as MemoryRow[];
        } else {
          rows = searchFtsStmt.all(sanitized) as MemoryRow[];
        }
      } else if (topic && topic.trim()) {
        rows = listByTopicStmt.all(topic.trim()) as MemoryRow[];
      } else {
        rows = listAllStmt.all() as MemoryRow[];
      }

      return rows.map(rowToRecord);
    },

    forget(id: number): boolean {
      const info = deleteStmt.run(id);
      return info.changes > 0;
    },

    getById(id: number): MemoryRecord | null {
      const row = getByIdStmt.get(id) as MemoryRow | undefined;
      return row ? rowToRecord(row) : null;
    },

    listTopics(): TopicCountRow[] {
      return listTopicsStmt.all() as TopicCountRow[];
    },

    close(): void {
      db.close();
    },
  };
}

export type MemoryDatabase = ReturnType<typeof createDatabase>;
