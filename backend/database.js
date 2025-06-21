import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Memory } from 'lowdb';

const defaultData = { books: [] };

// Use an in-memory database for tests, and a JSON file for everything else.
const adapter = process.env.NODE_ENV === 'test'
  ? new Memory()
  : new JSONFile('db.json');

export const db = new Low(adapter, defaultData);

/**
 * Initializes the database by reading from the adapter and writing initial data if empty.
 */
export const initDatabase = async () => {
  await db.read();
  db.data = db.data || defaultData;
  await db.write();
};
