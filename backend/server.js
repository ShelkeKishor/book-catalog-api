const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Read the database on startup
(async () => {
  await db.read();
})();

// --- API Endpoints for Books ---

// GET all books
app.get('/api/books', (req, res) => {
  res.json(db.data.books);
});

// GET a single book by ID
app.get('/api/books/:id', (req, res) => {
  const book = db.data.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.json(book);
});

// POST a new book
app.post('/api/books', async (req, res) => {
  const { title, author, published_year } = req.body;
  if (!title || !author || !published_year) {
    return res.status(400).json({ message: 'Title, author, and published year are required' });
  }

  const newBook = {
    id: nanoid(),
    title,
    author,
    published_year,
  };

  db.data.books.push(newBook);
  await db.write();
  res.status(201).json(newBook);
});

// PUT (update) a book by ID
app.put('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, published_year } = req.body;

  const bookIndex = db.data.books.findIndex((b) => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const updatedBook = {
    ...db.data.books[bookIndex],
    title: title || db.data.books[bookIndex].title,
    author: author || db.data.books[bookIndex].author,
    published_year: published_year || db.data.books[bookIndex].published_year,
  };

  db.data.books[bookIndex] = updatedBook;
  await db.write();
  res.json(updatedBook);
});

// DELETE a book by ID
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const bookIndex = db.data.books.findIndex((b) => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  db.data.books.splice(bookIndex, 1);
  await db.write();
  res.status(204).send(); // No Content
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
