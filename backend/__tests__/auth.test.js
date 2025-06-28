import request from 'supertest';
import app from '../server.js';
import { db } from '../database.js';

beforeEach(async () => {
  // Reset database before each test
  db.data = { users: [], books: [] };
  await db.write();
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register a user with existing username', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      // Try to create user with same username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'differentpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid username or password');
    });

    it('should not login with non-existent username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid username or password');
    });
  });
}); 