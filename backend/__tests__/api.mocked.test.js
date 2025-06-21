import request from 'supertest';
import http from 'http';
import app from '../server.js';
import { db } from '../database.js';

// Mock the database module
jest.mock('../database.js', () => ({
  db: {
    read: jest.fn(),
    write: jest.fn(),
    data: { books: [] },
  },
  initDatabase: jest.fn(), // Also mock initDatabase
}));

describe('Book Catalog API - Mocked Tests', () => {
  let server;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(resolve));
  });

  afterAll(() => {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });

  beforeEach(() => {
    // Before each test, reset the mock's data and clear mock call history
    db.data.books = [];
    db.write.mockClear();
    db.read.mockClear();
    // initDatabase is also a mock, so we can clear it
    db.initDatabase.mockClear();
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const newBook = { title: 'The Hobbit', author: 'J.R.R. Tolkien', published_year: 1937 };
      const response = await request(server).post('/api/books').send(newBook);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newBook.title);
      // Check that the book was added to our mock database
      expect(db.data.books).toHaveLength(1);
      // Check that the write function was called
      expect(db.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/books', () => {
    it('should get all books', async () => {
      // Populate the mock database
      db.data.books = [{ title: 'Fahrenheit 451', author: 'Ray Bradbury', published_year: 1953 }];

      const response = await request(server).get('/api/books');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Fahrenheit 451');
    });
  });
});
