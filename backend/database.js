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
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

/**
 * Initializes the database by reading from the adapter and writing initial data if empty.
 */
export const initDatabase = async () => {
    try {
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

export { db };
