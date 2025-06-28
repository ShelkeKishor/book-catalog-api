import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '../database.js';

export class User {
    static async findByEmail(email) {
        await db.read();
        return db.data.users?.find(user => user.email === email);
    }

    static async create({ email, password, name }) {
        await db.read();
        
        // Initialize users array if it doesn't exist
        if (!db.data.users) {
            db.data.users = [];
        }

        // Check if user already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = {
            id: nanoid(),
            email,
            password: hashedPassword,
            name,
            createdAt: new Date().toISOString()
        };

        db.data.users.push(user);
        await db.write();

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
} 