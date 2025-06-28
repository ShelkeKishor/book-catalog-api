import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const defaultData = { 
  books: [],
  users: []
};

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const getDbPath = () => {
  if (process.env.NODE_ENV === 'test') {
    return join(__dirname, '__tests__', 'test-db.json');
  }
  return join(__dirname, 'db.json');
};

// For tests, use in-memory database to avoid file permission issues
let db;
if (process.env.NODE_ENV === 'test') {
  // Create a simple in-memory database for tests
  db = {
    data: { ...defaultData },
    read: async () => {},
    write: async () => {}
  };
} else {
  const file = getDbPath();
  const adapter = new JSONFile(file);
  db = new Low(adapter, defaultData);
}

/**
 * Initializes the database by reading from the adapter and writing initial data if empty.
 */
export const initDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      // For tests, just ensure default data structure
      db.data = { ...defaultData };
      return;
    }
    
    await db.read();
        
    // Ensure all collections exist
    db.data = db.data || defaultData;
    db.data.books = db.data.books || [];
    db.data.users = db.data.users || [];
        
    await db.write();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // In test environment, we can continue with in-memory database
    if (process.env.NODE_ENV !== 'test') {
      throw error;
    }
    db.data = defaultData;
  }
};

/**
 * Gets the database instance. Creates a new one if it doesn't exist.
 */
export const getDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return db;
    }
    
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return db;
  } catch (error) {
    console.error('Error getting database:', error);
    if (process.env.NODE_ENV === 'test') {
      return db;
    }
    throw error;
  }
};

export { db };
