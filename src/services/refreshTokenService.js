import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const DEFAULT_REFRESH_DAYS = 14;

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiry() {
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? `${DEFAULT_REFRESH_DAYS}`, 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

class RefreshTokenService {
    generateRawToken() {
        return crypto.randomBytes(32).toString('base64url');
    }

    async issueRefreshToken({
        tenantId,
        userId,
        sessionId,
        deviceId,
        createdByIp,
        createdByUserAgent,
        metadata,
        tokenFamilyId,
    }) {
        const rawToken = this.generateRawToken();
        const tokenHash = hashToken(rawToken);
        const familyId = tokenFamilyId ?? uuidv4();

        const record = await prisma.refreshToken.create({
            data: {
                tenantId,
                userId,
                sessionId,
                deviceId,
                tokenHash,
                tokenFamilyId: familyId,
                expiresAt: getRefreshExpiry(),
                createdByIp,
                createdByUserAgent,
                metadata,
            },
        });

        return { rawToken, record };
    }

    async rotateRefreshToken({ rawToken, usedByIp, usedByUserAgent, deviceId }) {
        const tokenHash = hashToken(rawToken);
        const record = await prisma.refreshToken.findUnique({
            where: { tokenHash },
        });

        if (!record) {
            return { error: 'INVALID_TOKEN' };
        }

        const now = new Date();
        if (record.expiresAt <= now) {
            await prisma.refreshToken.update({
                where: { id: record.id },
                data: { status: 'EXPIRED' },
            });
            return { error: 'EXPIRED_TOKEN', record };
        }

        if (record.status !== 'ACTIVE') {
            await this.markFamilyReuseDetected({
                tenantId: record.tenantId,
                tokenFamilyId: record.tokenFamilyId,
            });
            return { error: 'REUSED_TOKEN', record };
        }

        const { rawToken: newRawToken, record: newRecord } = await this.issueRefreshToken({
            tenantId: record.tenantId,
            userId: record.userId,
            sessionId: record.sessionId,
            deviceId: deviceId ?? record.deviceId,
            createdByIp: usedByIp,
            createdByUserAgent: usedByUserAgent,
            metadata: record.metadata ?? undefined,
            tokenFamilyId: record.tokenFamilyId,
        });

        await prisma.refreshToken.update({
            where: { id: record.id },
            data: {
                status: 'ROTATED',
                rotatedAt: now,
                replacedByTokenId: newRecord.id,
                lastUsedAt: now,
                lastUsedIp: usedByIp,
                lastUsedUserAgent: usedByUserAgent,
            },
        });

        await prisma.refreshToken.update({
            where: { id: newRecord.id },
            data: {
                parentTokenId: record.id,
            },
        });

        return {
            rawToken: newRawToken,
            record: newRecord,
            previousRecord: record,
        };
    }

    async revokeByRawToken(rawToken) {
        const tokenHash = hashToken(rawToken);
        const record = await prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!record) {
            return null;
        }
        await prisma.refreshToken.update({
            where: { id: record.id },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
            },
        });
        return record;
    }

    async revokeAllByUser({ tenantId, userId }) {
        await prisma.refreshToken.updateMany({
            where: {
                tenantId,
                userId,
                status: { in: ['ACTIVE', 'ROTATED'] },
            },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
            },
        });
    }

    async markFamilyReuseDetected({ tenantId, tokenFamilyId }) {
        await prisma.refreshToken.updateMany({
            where: { tenantId, tokenFamilyId },
            data: {
                status: 'REUSED',
                reuseDetectedAt: new Date(),
                revokedAt: new Date(),
            },
        });
    }

    async findByRawToken(rawToken) {
        const tokenHash = hashToken(rawToken);
        return prisma.refreshToken.findUnique({ where: { tokenHash } });
    }
}

export default new RefreshTokenService();
