import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Endpoints for Books ---

// GET all books
app.get('/api/books', async (req, res) => {
  await db.read();
  res.json(db.data.books);
});

// GET a single book by ID
app.get('/api/books/:id', async (req, res) => {
  await db.read();
  const book = db.data.books.find(b => b.id === req.params.id);
  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

// POST a new book
app.post('/api/books', async (req, res) => {
  const { title, author, published_year } = req.body;

  if (!title || !author || !published_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newBook = { id: nanoid(), title, author, published_year };
  db.data.books.push(newBook);
  await db.write();

  res.status(201).json(newBook);
});

// PUT (update) a book by ID
app.put('/api/books/:id', async (req, res) => {
  await db.read();
  const bookIndex = db.data.books.findIndex(b => b.id === req.params.id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  db.data.books[bookIndex] = { ...db.data.books[bookIndex], ...req.body };
  await db.write();

  res.json(db.data.books[bookIndex]);
});

// DELETE a book by ID
app.delete('/api/books/:id', async (req, res) => {
  await db.read();
  const bookIndex = db.data.books.findIndex(b => b.id === req.params.id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  db.data.books.splice(bookIndex, 1);
  await db.write();

  res.status(204).send();
});

export default app;
