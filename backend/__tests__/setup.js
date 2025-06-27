// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console.error to catch and display errors
const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  console.log('Stack trace:', new Error().stack);
}; 