"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTokenService = void 0;
const prisma_1 = require("../lib/prisma");
const MFA_CODE_TTL_MIN = 10;
const RESET_TOKEN_TTL_HOURS = 1;
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
exports.authTokenService = {
    async createPasswordReset(email) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        const { token, tokenHash } = await Promise.resolve().then(() => __importStar(require("../utils/token"))).then((m) => m.generateToken());
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
        await prisma_1.prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });
        return token;
    },
    async consumePasswordReset(token, newPasswordHash) {
        const { hashTokenValue } = await Promise.resolve().then(() => __importStar(require("../utils/token")));
        const tokenHash = hashTokenValue(token);
        const record = await prisma_1.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!record || record.usedAt || record.expiresAt < new Date())
            return false;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
            prisma_1.prisma.user.update({ where: { id: record.userId }, data: { password: newPasswordHash } }),
        ]);
        return true;
    },
    async createEmailVerification(userId) {
        const { token, tokenHash } = await Promise.resolve().then(() => __importStar(require("../utils/token"))).then((m) => m.generateToken());
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma_1.prisma.emailVerificationToken.create({
            data: { userId, tokenHash, expiresAt },
        });
        return token;
    },
    async consumeEmailVerification(token) {
        const { hashTokenValue } = await Promise.resolve().then(() => __importStar(require("../utils/token")));
        const tokenHash = hashTokenValue(token);
        const record = await prisma_1.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
        if (!record || record.usedAt || record.expiresAt < new Date())
            return false;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
            prisma_1.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
        ]);
        return true;
    },
    async createMfaChallenge(userId) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + MFA_CODE_TTL_MIN * 60 * 1000);
        await prisma_1.prisma.mfaChallenge.create({ data: { userId, code, expiresAt } });
        return code;
    },
    async consumeMfaChallenge(userId, code) {
        const record = await prisma_1.prisma.mfaChallenge.findFirst({
            where: { userId, code, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
        });
        if (!record)
            return false;
        await prisma_1.prisma.mfaChallenge.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        return true;
    },
};
//# sourceMappingURL=authTokenService.js.map