const db = {
  read: jest.fn().mockResolvedValue(),
  write: jest.fn().mockResolvedValue(),
  data: { books: [] },
};

const initDatabase = jest.fn().mockResolvedValue();

module.exports = { db, initDatabase };
