import { jest } from '@jest/globals';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { db } from '../database.js';
import { rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDbPath = join(__dirname, 'test-db.json');

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || 3000;
process.env.JWT_SECRET = 'test-secret-key';

// Initialize test database before all tests
beforeAll(async () => {
  try {
    const adapter = new JSONFile(testDbPath);
    const testDb = new Low(adapter);
    await testDb.read();
    testDb.data = { users: [], books: [] };
    await testDb.write();
    
    // Ensure the main db instance is using the test database
    db.data = testDb.data;
    await db.write();
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
});

// Clean up test database after all tests
afterAll(async () => {
  try {
    await rm(testDbPath);
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Reset database state before each test
beforeEach(async () => {
  try {
    db.data = { users: [], books: [] };
    await db.write();
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
});

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console.error to catch and display errors
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ExperimentalWarning')) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock console.warn to suppress warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ExperimentalWarning')) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Silence console.log during tests unless explicitly needed
const originalLog = console.log;
console.log = (...args) => {
  if (process.env.DEBUG) {
    originalLog(...args);
  }
}; 