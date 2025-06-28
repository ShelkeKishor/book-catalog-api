// Set test environment
process.env.NODE_ENV = 'test';

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