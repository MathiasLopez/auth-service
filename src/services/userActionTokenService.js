import crypto from 'crypto';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const ACTION_TOKEN_EXPIRATIONS_MIN = {
    EMAIL_VERIFICATION: 24 * 60,
    PASSWORD_RESET: 60,
    CHANGE_EMAIL: 60,
    MAGIC_LOGIN: 15,
    MFA_ENROLLMENT: 30,
};

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function getExpiresAt(type) {
    const minutes = ACTION_TOKEN_EXPIRATIONS_MIN[type] ?? 60;
    return new Date(Date.now() + minutes * 60 * 1000);
}

class UserActionTokenService {
    generateRawToken() {
        return crypto.randomBytes(32).toString('base64url');
    }

    async createActionToken({
        tenantId,
        userId,
        type,
        createdByIp,
        createdByUserAgent,
        metadata,
        revokePrevious = true,
    }) {
        let replacesTokenId = null;
        if (revokePrevious) {
            const previous = await prisma.userActionToken.findFirst({
                where: {
                    tenantId,
                    userId,
                    type,
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (previous) {
                replacesTokenId = previous.id;
            }
            await prisma.userActionToken.updateMany({
                where: {
                    tenantId,
                    userId,
                    type,
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: new Date() },
                },
                data: {
                    revokedAt: new Date(),
                },
            });
        }

        const rawToken = this.generateRawToken();
        const tokenHash = hashToken(rawToken);
        const record = await prisma.userActionToken.create({
            data: {
                tenantId,
                userId,
                type,
                tokenHash,
                expiresAt: getExpiresAt(type),
                createdByIp,
                createdByUserAgent,
                replacesTokenId,
                metadata,
            },
        });

        return { rawToken, record };
    }

    async consumeActionToken({
        rawToken,
        type,
        consumedByIp,
        consumedByUserAgent,
    }) {
        const tokenHash = hashToken(rawToken);
        const record = await prisma.userActionToken.findUnique({
            where: { tokenHash },
        });

        const validation = this.validateRecord({ record, type });
        if (validation.error) {
            return validation;
        }

        const updated = await prisma.userActionToken.update({
            where: { id: record.id },
            data: {
                usedAt: new Date(),
                consumedByIp,
                consumedByUserAgent,
            },
        });

        return { record: updated };
    }

    validateRecord({ record, type }) {
        if (!record) {
            return { error: 'INVALID_TOKEN' };
        }
        if (record.type !== type) {
            return { error: 'INVALID_TOKEN_TYPE' };
        }
        if (record.revokedAt || record.usedAt) {
            return { error: 'TOKEN_ALREADY_USED' };
        }
        if (record.expiresAt <= new Date()) {
            return { error: 'TOKEN_EXPIRED' };
        }
        return { record };
    }

    async validateActionToken({ rawToken, type }) {
        const tokenHash = hashToken(rawToken);
        const record = await prisma.userActionToken.findUnique({
            where: { tokenHash },
        });
        return this.validateRecord({ record, type });
    }
}

export default new UserActionTokenService();
