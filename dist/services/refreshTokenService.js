"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE_MAX_AGE_MS = exports.REFRESH_COOKIE_NAME = exports.refreshTokenService = void 0;
exports.refreshCookieOptions = refreshCookieOptions;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const REFRESH_TOKEN_TTL_DAYS = 30;
function generateOpaqueToken() {
    const token = crypto_1.default.randomBytes(48).toString("base64url");
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    return { token, tokenHash };
}
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
exports.refreshTokenService = {
    async issue(userId, meta) {
        const { token, tokenHash } = generateOpaqueToken();
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
                userAgent: meta?.userAgent,
                ipAddress: meta?.ipAddress,
            },
        });
        return { token, expiresAt };
    },
    async rotate(presentedToken, meta) {
        const tokenHash = hashToken(presentedToken);
        const record = await prisma_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!record || record.revokedAt || record.expiresAt < new Date())
            return null;
        const { token: newToken, tokenHash: newHash } = generateOpaqueToken();
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.refreshToken.update({
                where: { id: record.id },
                data: { revokedAt: new Date(), replacedBy: newHash.slice(0, 16) },
            }),
            prisma_1.prisma.refreshToken.create({
                data: {
                    userId: record.userId,
                    tokenHash: newHash,
                    expiresAt,
                    userAgent: meta?.userAgent,
                    ipAddress: meta?.ipAddress,
                },
            }),
        ]);
        return { token: newToken, expiresAt, userId: record.userId };
    },
    async revoke(presentedToken) {
        const tokenHash = hashToken(presentedToken);
        await prisma_1.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },
    async revokeAllForUser(userId) {
        await prisma_1.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },
};
exports.REFRESH_COOKIE_NAME = "cf_refresh";
exports.REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
function refreshCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: exports.REFRESH_COOKIE_MAX_AGE_MS,
    };
}
//# sourceMappingURL=refreshTokenService.js.map