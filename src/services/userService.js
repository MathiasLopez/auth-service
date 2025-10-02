import bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

class UserService {
    async register({ username, email, password }) {
        try {
            validateUsername(username);
            validateEmail(email)
            validatePassword(password);
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
            const userRole = await prisma.role.findUnique({
                where: { name: 'user' },
            });

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    isActive: process.env.NODE_ENV === "development",
                    roles: {
                        create: [
                            {
                                role: { connect: { id: userRole.id } },
                            },
                        ],
                    }
                },
                include: { roles: true },
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error }
        }
    }

    getUserByUsername(username) {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    checkPassword({ user, password }) {
        return bcrypt.compare(password, user.password)
    }
}

function validateUsername(username) {
    if (typeof username !== 'string') {
        throw new Error('Username must be a string');
    }

    if (username.length < 5 || username.length > 20) {
        throw new Error('Username must be between 5 and 20 characters long');
    }

    // Only letters, numbers, dots, or underscores
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
        throw new Error('Username can only contain letters, numbers, dots, and underscores');
    }
}

function validateEmail(email) {
    if (typeof email !== 'string') {
        throw new Error('Email must be a string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
}

function validatePassword(password) {
    if (typeof password !== 'string') {
        throw new Error('Password must be a string');
    }

    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }

    // Password must contain uppercase letters, lowercase letters, numbers, and symbols.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    if (!passwordRegex.test(password)) {
        throw new Error('Password must include uppercase, lowercase, number, and special character');
    }
}

export default new UserService();