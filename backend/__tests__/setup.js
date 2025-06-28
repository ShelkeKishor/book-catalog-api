import { db } from '../database.js';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || 3000;
process.env.JWT_SECRET = 'test-secret-key';

// Initialize test database
beforeAll(async () => {
  // Ensure database is initialized with empty collections
  db.data = { users: [], books: [] };
  await db.write();
});

// Clean up after all tests
afterAll(async () => {
  // Clean up database
  db.data = { users: [], books: [] };
  await db.write();
});

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console.error to catch and display errors
const originalError = console.error;
console.error = (...args) => {
  // Only log error in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    originalError(...args);
    console.log('Stack trace:', new Error().stack);
  }
};

// Silence console.log during tests unless explicitly needed
const originalLog = console.log;
console.log = (...args) => {
  if (process.env.DEBUG) {
    originalLog(...args);
  }
}; 