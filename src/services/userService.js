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
                    roles: {
                        create: [
                            {
                                role: { connect: { id: userRole.id } },
                                createdBy: "00000000-0000-0000-0000-000000000000",
                                updatedBy: "00000000-0000-0000-0000-000000000000",
                            },
                        ],
                    }
                },
                include: { roles: true },
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, message: error }
        }
    }

    getUserByUsername(username) {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    getUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Retrieves a list of users from the database.
     * 
     * If `excludeUserId` is provided, the user with that ID will be excluded from the results.
     *
     * @param {Object} [options={}] - Options for the query.
     * @param {number|string} [options.excludeUserId] - ID of the user to exclude from the results.
     * @returns {Promise<Array<{id: number, username: string}>>} A list of users.
     */
    async getUsers({ excludeUserId } = {}) {
        const where = excludeUserId ? { id: { not: excludeUserId } } : {};
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true
            }
        });
        return users
    }

    checkPassword({ user, password }) {
        return bcrypt.compare(password, user.password)
    }

    async emailVerification(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isActive)
            return { alreadyActive: true };

        await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
        });

        return { verified: true };
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