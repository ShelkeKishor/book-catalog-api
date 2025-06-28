import request from 'supertest';
import app from '../server.js';
import { db } from '../database.js';

let authToken;
let userId;

beforeAll(async () => {
  // Create a test user and get auth token
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  authToken = res.body.token;
  userId = res.body.user.id;
});

beforeEach(async () => {
  // Reset database before each test, but keep the test user
  const users = db.data.users;
  db.data = { users, books: [] };
  await db.write();
});

describe('Books API Endpoints', () => {
  describe('GET /api/books', () => {
    it('should return empty array when no books exist', async () => {
      const res = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all books', async () => {
      // Add a test book first
      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          published_year: 2024
        });

      const res = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('title', 'Test Book');
      expect(res.body[0]).toHaveProperty('userId', userId);
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Book',
          author: 'New Author',
          published_year: 2024
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'New Book');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('userId', userId);
    });

    it('should not create a book without required fields', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Book'
          // Missing author and published_year
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields');
    });
  });

  describe('PUT /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      // Create a test book
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          published_year: 2024
        });
      bookId = res.body.id;
    });

    it('should update an existing book', async () => {
      const res = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Book',
          author: 'Updated Author',
          published_year: 2023
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('title', 'Updated Book');
      expect(res.body).toHaveProperty('userId', userId);
    });

    it('should not update a book that belongs to another user', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${anotherUserRes.body.token}`)
        .send({
          title: 'Updated Book',
          author: 'Updated Author',
          published_year: 2023
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized to update this book');
    });
  });

  describe('DELETE /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      // Create a test book
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          published_year: 2024
        });
      bookId = res.body.id;
    });

    it('should delete an existing book', async () => {
      const res = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(204);

      // Verify book is deleted
      const getRes = await request(app)
        .get(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should not delete a book that belongs to another user', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${anotherUserRes.body.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized to delete this book');
    });
  });
}); 