import request from 'supertest';
import http from 'http';
import app from '../server.js';
import { db, initDatabase } from '../database.js';

describe('Book Catalog API - Integration Tests', () => {
  let server;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(resolve)); // Listen on a random available port
    await initDatabase();
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

  beforeEach(async () => {
    db.data.books = [];
    await db.write();
  });

  describe('GET /api/books', () => {
    it('should return an empty array when no books exist', async () => {
      const response = await request(server).get('/api/books');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all books', async () => {
      const book = { id: '1', title: '1984', author: 'George Orwell', published_year: 1949 };
      db.data.books.push(book);
      await db.write();

      const response = await request(server).get('/api/books');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('1984');
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book and return it', async () => {
      const newBook = { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', published_year: 1925 };
      const response = await request(server).post('/api/books').send(newBook);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newBook.title);
      expect(response.body.id).toBeDefined();
      
      await db.read();
      expect(db.data.books).toHaveLength(1);
      expect(db.data.books[0].title).toBe('The Great Gatsby');
    });

    it('should return 400 if required fields are missing', async () => {
        const response = await request(server).post('/api/books').send({ title: 'Incomplete' });
        expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book and return the updated version', async () => {
      const book = { id: 'update-id', title: 'Old Title', author: 'Old Author', published_year: 2020 };
      db.data.books.push(book);
      await db.write();

      const updatedData = { title: 'New Title' };
      const response = await request(server).put(`/api/books/${book.id}`).send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
    });

    it('should return a 404 error when trying to update a non-existent book', async () => {
      const response = await request(server).put('/api/books/nonexistentid').send({ title: 'Wont work' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete a book by its ID', async () => {
      const book = { id: 'delete-id', title: 'To Be Deleted', author: 'An Author', published_year: 2019 };
      db.data.books.push(book);
      await db.write();

      const deleteResponse = await request(server).delete(`/api/books/${book.id}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(server).get(`/api/books/${book.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return a 404 error when trying to delete a non-existent book', async () => {
      const response = await request(server).delete('/api/books/nonexistentid');
      expect(response.status).toBe(404);
    });
  });
});
