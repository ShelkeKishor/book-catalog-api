const apiUrl = 'http://localhost:3000/api/books';
const bookList = document.getElementById('book-list');
const addBookForm = document.getElementById('add-book-form');

// --- Functions to interact with the API ---

// Fetch all books from the API and display them
const getBooks = async () => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const books = await response.json();
    renderBooks(books);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    bookList.innerHTML = '<li>Error loading books. Is the server running?</li>';
  }
};

// Add a new book
const addBook = async (book) => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(book),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    getBooks(); // Refresh the list
  } catch (error) {
    console.error('Failed to add book:', error);
  }
};

// Delete a book
const deleteBook = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    getBooks(); // Refresh the list
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
};

// --- DOM Manipulation ---

// Render the list of books to the page
const renderBooks = (books) => {
  bookList.innerHTML = ''; // Clear the list
  if (books.length === 0) {
    bookList.innerHTML = '<li>No books in the catalog yet.</li>';
    return;
  }

  books.forEach(book => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="book-details">
        <strong>${book.title}</strong> by ${book.author} (${book.published_year})
      </div>
      <button class="delete-btn" data-id="${book.id}">Delete</button>
    `;
    bookList.appendChild(li);
  });
};

// --- Event Listeners ---

// Handle form submission for adding a new book
addBookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('title');
  const authorInput = document.getElementById('author');
  const yearInput = document.getElementById('published_year');

  const newBook = {
    title: titleInput.value,
    author: authorInput.value,
    published_year: parseInt(yearInput.value, 10),
  };

  addBook(newBook);
  addBookForm.reset(); // Clear the form
});

// Handle clicks on delete buttons
bookList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const bookId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this book?')) {
        deleteBook(bookId);
    }
  }
});

// --- Initial Load ---

// Fetch and display books when the page loads
document.addEventListener('DOMContentLoaded', getBooks);
