import { jest } from '@jest/globals';
import { db } from '../database.js';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || 3000;
process.env.JWT_SECRET = 'test-secret-key';

// Initialize test database before all tests
beforeAll(async () => {
  try {
    // Reset database to initial state
    db.data = { users: [], books: [] };
    console.log('Test database initialized successfully');
  } catch (error) {
    console.error('Error initializing test database:', error);
    db.data = { users: [], books: [] };
  }
});

// Reset database state before each test
beforeEach(async () => {
  try {
    db.data = { users: [], books: [] };
  } catch (error) {
    console.error('Error resetting test database:', error);
    db.data = { users: [], books: [] };
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