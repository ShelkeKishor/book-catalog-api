import bcrypt from 'bcryptjs';
import { db } from '../database.js';

class User {
  static async findByUsername(username) {
    await db.read();
    return db.data.users.find(user => user.username === username);
  }

  static async create(username, password) {
    await db.read();
    if (await this.findByUsername(username)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      books: []
    };

    db.data.users.push(user);
    await db.write();
    return user;
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static async deleteUser(userId) {
    await db.read();
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    db.data.users.splice(userIndex, 1);
    await db.write();
  }
}

export default User; 