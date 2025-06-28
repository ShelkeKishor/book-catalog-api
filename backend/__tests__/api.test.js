import request from 'supertest';
import http from 'http';
import app from '../server.js';
import { db, initDatabase } from '../database.js';

describe('Book Catalog API - Integration Tests', () => {
  let server;
  let authToken;
  let userId;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve)); // Listen on a random available port
    await initDatabase();

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

  afterAll(async () => {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Reset database before each test, but keep the test user
    const users = db.data.users;
    db.data = { users, books: [] };
    await db.write();
  });

  describe('GET /api/books', () => {
    it('should return an empty array when no books exist', async () => {
      const response = await request(server)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all books', async () => {
      const book = { id: '1', title: '1984', author: 'George Orwell', published_year: 1949, userId };
      db.data.books.push(book);
      await db.write();

      const response = await request(server)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('1984');
      expect(response.body[0].userId).toBe(userId);
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book and return it', async () => {
      const newBook = { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', published_year: 1925 };
      const response = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBook);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newBook.title);
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(userId);
      
      await db.read();
      expect(db.data.books).toHaveLength(1);
      expect(db.data.books[0].title).toBe('The Great Gatsby');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Incomplete Book' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });
  });

  describe('PUT /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      // Create a test book
      const book = { id: 'test-book', title: 'Original Title', author: 'Original Author', published_year: 2024, userId };
      db.data.books.push(book);
      await db.write();
      bookId = book.id;
    });

    it('should update an existing book', async () => {
      const updatedData = { title: 'Updated Title', author: 'Updated Author', published_year: 2023 };
      const response = await request(server)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.author).toBe(updatedData.author);
      expect(response.body.published_year).toBe(updatedData.published_year);
      expect(response.body.userId).toBe(userId);
    });

    it('should not update a book that belongs to another user', async () => {
      // Create another user
      const anotherUserRes = await request(server)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          password: 'password123'
        });

      const response = await request(server)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${anotherUserRes.body.token}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update this book');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(server)
        .put('/api/books/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Book not found');
    });
  });

  describe('DELETE /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      // Create a test book
      const book = { id: 'test-book', title: 'Test Book', author: 'Test Author', published_year: 2024, userId };
      db.data.books.push(book);
      await db.write();
      bookId = book.id;
    });

    it('should delete an existing book', async () => {
      const response = await request(server)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify book is deleted
      const getResponse = await request(server)
        .get(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getResponse.status).toBe(404);
    });

    it('should not delete a book that belongs to another user', async () => {
      // Create another user
      const anotherUserRes = await request(server)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          password: 'password123'
        });

      const response = await request(server)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${anotherUserRes.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to delete this book');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(server)
        .delete('/api/books/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Book not found');
    });
  });
});
