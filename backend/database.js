const { join } = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// Path to the database file
const file = join(__dirname, 'db.json');

// Configure lowdb to write to a JSON file, with default data
const adapter = new JSONFile(file);
const db = new Low(adapter, { books: [] });

module.exports = db;
