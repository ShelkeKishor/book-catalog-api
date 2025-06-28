import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Create user
        const user = await User.create({ email, password, name });

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'test-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user,
            token
        });
    } catch (error) {
        if (error.message === 'User already exists') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error registering user' });
    }
});

/**
 * @route POST /api/auth/login
 * @description Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Validate password
        const isValidPassword = await User.validatePassword(user, password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'test-secret-key',
            { expiresIn: '24h' }
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

export default router; 