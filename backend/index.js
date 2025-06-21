import http from 'http';
import app from './server.js';
import { initDatabase } from './database.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const startServer = async () => {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
