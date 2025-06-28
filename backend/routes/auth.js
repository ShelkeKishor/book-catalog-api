import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.create(username, password);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error creating user' });
  }
});

/**
 * @route POST /api/auth/login
 * @description Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await User.validatePassword(user, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
  }
});

router.delete('/user', authenticateToken, async (req, res) => {
  try {
    await User.deleteUser(req.user.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

export default router; 