"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
const refreshTokenService_1 = require("./refreshTokenService");
const sessionActivity_1 = require("./sessionActivity");
const seedData_1 = require("../services/seedData");
async function issueTokenPair(user, meta, sessionTimeoutMinutes) {
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId, organizationName: user.organizationName }, (0, jwt_1.getJwtSecret)(), { expiresIn: (0, jwt_1.getJwtExpiryFromMinutes)(sessionTimeoutMinutes) });
    const { token: refreshToken, expiresAt } = await refreshTokenService_1.refreshTokenService.issue(user.id, meta);
    sessionActivity_1.sessionActivity.touch(user.id, sessionTimeoutMinutes);
    return { token, refreshToken, refreshExpiresAt: expiresAt, user };
}
exports.authService = {
    async register(email, password, name, role, organizationId, meta) {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            const error = new Error("An account with this email already exists. Please sign in instead.");
            error.code = "EMAIL_TAKEN";
            throw error;
        }
        let effectiveOrganizationId = organizationId;
        if (!effectiveOrganizationId) {
            const organization = await prisma_1.prisma.organization.create({
                data: { name: `${name}'s Organization` },
            });
            effectiveOrganizationId = organization.id;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: (role || "SUPER_ADMIN"),
                organizationId: effectiveOrganizationId,
            },
            include: { organization: true },
        });
        await (0, seedData_1.seedOrganization)(effectiveOrganizationId);
        return issueTokenPair({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        }, meta, user.organization.sessionTimeoutMinutes);
    },
    async registerChurch(churchName, adminName, email, password, meta) {
        const organization = await prisma_1.prisma.organization.create({
            data: {
                name: churchName,
            },
        });
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: adminName,
                role: "SUPER_ADMIN",
                organizationId: organization.id,
            },
            include: { organization: true },
        });
        await (0, seedData_1.seedOrganization)(organization.id);
        return issueTokenPair({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        }, meta, user.organization.sessionTimeoutMinutes);
    },
    async authenticate(email, password, meta) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { organization: true },
        });
        if (!user)
            throw new Error("Invalid credentials");
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            throw new Error("Invalid credentials");
        return issueTokenPair({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        }, meta, user.organization.sessionTimeoutMinutes);
    },
    async getUserById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: { organization: true },
        }).then((user) => {
            if (!user)
                return null;
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
                emailVerified: user.emailVerified,
                mfaEnabled: user.mfaEnabled,
                createdAt: user.createdAt,
            };
        });
    },
    async issueTokenForUser(user, meta) {
        return issueTokenPair({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        }, meta, user.organization.sessionTimeoutMinutes);
    },
    async refresh(presentedToken, meta) {
        const rotated = await refreshTokenService_1.refreshTokenService.rotate(presentedToken, meta);
        if (!rotated)
            return null;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: rotated.userId },
            include: { organization: true },
        });
        if (!user)
            return null;
        if (sessionActivity_1.sessionActivity.isExpired(rotated.userId)) {
            sessionActivity_1.sessionActivity.revoke(rotated.userId);
            return null;
        }
        sessionActivity_1.sessionActivity.touch(rotated.userId, user.organization.sessionTimeoutMinutes);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId, organizationName: user.organization.name }, (0, jwt_1.getJwtSecret)(), { expiresIn: (0, jwt_1.getJwtExpiryFromMinutes)(user.organization.sessionTimeoutMinutes) });
        return {
            token,
            refreshToken: rotated.token,
            refreshExpiresAt: rotated.expiresAt,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
            },
        };
    },
    async logout(presentedToken, userId) {
        if (presentedToken) {
            await refreshTokenService_1.refreshTokenService.revoke(presentedToken);
        }
        if (userId) {
            await refreshTokenService_1.refreshTokenService.revokeAllForUser(userId);
            sessionActivity_1.sessionActivity.revoke(userId);
        }
    },
};
//# sourceMappingURL=authService.js.map