import request from 'supertest';
import http from 'http';
import app from '../server.js';
import { jest } from '@jest/globals';

// Mock the database module
jest.mock('../database.js', () => ({
  db: {
    read: jest.fn(),
    write: jest.fn(),
    data: { books: [], users: [] }
  },
  initDatabase: jest.fn()
}));

describe('Book Catalog API - Mocked Tests', () => {
  let server;
  let authToken;
  let userId;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(resolve));

    // Create a test user and get auth token
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    authToken = res.body.token;
    userId = res.body.user.id;
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
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const newBook = { title: 'The Hobbit', author: 'J.R.R. Tolkien', published_year: 1937 };
      const response = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBook);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newBook.title);
      expect(response.body.userId).toBe(userId);
      // Check that the book was added to our mock database
      expect(db.data.books).toHaveLength(1);
      // Check that the write function was called
      expect(db.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/books', () => {
    it('should get all books', async () => {
      // Populate the mock database
      db.data.books = [{ title: 'Fahrenheit 451', author: 'Ray Bradbury', published_year: 1953, userId }];

      const response = await request(server)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Fahrenheit 451');
      expect(response.body[0].userId).toBe(userId);
    });
  });
});
