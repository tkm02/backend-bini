// src/services/authService.js
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async registerUser(userData) {
    const { email, password, firstName, lastName } = userData;

    // Vérifier email unique
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email déjà utilisé');
    }

    // Hasher mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user'
      }
    });

    // Générer token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  static async loginUser(email, password) {
    // Trouver utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static sanitizeUser(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
