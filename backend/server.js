import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth routes
app.use('/api/auth', authRoutes);

// --- Protected API Endpoints for Books ---

// GET all books
app.get('/api/books', authenticateToken, async (req, res) => {
  await db.read();
  res.json(db.data.books);
});

// GET a single book by ID
app.get('/api/books/:id', authenticateToken, async (req, res) => {
  await db.read();
  const book = db.data.books.find(b => b.id === req.params.id);
  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

// POST a new book
app.post('/api/books', authenticateToken, async (req, res) => {
  const { title, author, published_year } = req.body;

  if (!title || !author || !published_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newBook = { 
    id: nanoid(), 
    title, 
    author, 
    published_year,
    userId: req.user.userId // Associate book with user
  };
  
  await db.read();
  db.data.books.push(newBook);
  await db.write();

  res.status(201).json(newBook);
});

// PUT (update) a book by ID
app.put('/api/books/:id', authenticateToken, async (req, res) => {
  await db.read();
  const bookIndex = db.data.books.findIndex(b => b.id === req.params.id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  // Check if user owns the book
  if (db.data.books[bookIndex].userId !== req.user.userId) {
    return res.status(403).json({ message: 'Not authorized to update this book' });
  }

  const updatedBook = { 
    ...db.data.books[bookIndex], 
    ...req.body,
    id: db.data.books[bookIndex].id, // Prevent ID from being updated
    userId: req.user.userId // Prevent userId from being updated
  };
  
  db.data.books[bookIndex] = updatedBook;
  await db.write();

  res.json(updatedBook);
});

// DELETE a book by ID
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  await db.read();
  const bookIndex = db.data.books.findIndex(b => b.id === req.params.id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  // Check if user owns the book
  if (db.data.books[bookIndex].userId !== req.user.userId) {
    return res.status(403).json({ message: 'Not authorized to delete this book' });
  }

  db.data.books.splice(bookIndex, 1);
  await db.write();

  res.status(204).send();
});

export default app;
