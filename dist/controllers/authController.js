"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateProfile = exports.me = exports.refresh = exports.logout = exports.registerChurch = exports.signup = exports.disableMfa = exports.enableMfa = exports.verifyMfa = exports.login = void 0;
const authService_1 = require("../services/authService");
const authTokenService_1 = require("../services/authTokenService");
const mailerService_1 = require("../services/mailerService");
const auditService_1 = require("../services/auditService");
const prisma_1 = require("../lib/prisma");
const refreshTokenService_1 = require("../services/refreshTokenService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
function getRequestMeta(req) {
    const ua = req.headers["user-agent"] || undefined;
    const xff = req.headers["x-forwarded-for"] || "";
    const ip = xff.split(",")[0]?.trim() || req.socket.remoteAddress || undefined;
    return { userAgent: ua, ipAddress: ip };
}
function setRefreshCookie(res, refreshToken) {
    res.cookie(refreshTokenService_1.REFRESH_COOKIE_NAME, refreshToken, (0, refreshTokenService_1.refreshCookieOptions)());
}
function clearRefreshCookie(res) {
    res.clearCookie(refreshTokenService_1.REFRESH_COOKIE_NAME, { path: "/" });
}
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
function isLockedOut(user) {
    if (!user.lockoutUntil)
        return false;
    return new Date(user.lockoutUntil) > new Date();
}
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        if (isLockedOut(user)) {
            return res.status(403).json({ error: "Account locked due to too many failed attempts. Try again later." });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            const nextCount = user.failedLoginCount + 1;
            const lockoutUntil = nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { failedLoginCount: nextCount, lockoutUntil: lockoutUntil || undefined },
            });
            return res.status(401).json({ error: "Invalid credentials" });
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockoutUntil: null },
        });
        if (user.mfaEnabled) {
            const code = await authTokenService_1.authTokenService.createMfaChallenge(user.id);
            mailerService_1.mailerService.sendMfaCode(email, code).catch((e) => console.error("[MFA email error]", e));
            return res.status(200).json({ mfaRequired: true, userId: user.id });
        }
        const result = await authService_1.authService.authenticate(email, password, getRequestMeta(req));
        setRefreshCookie(res, result.refreshToken);
        return res.status(200).json(result);
    }
    catch {
        return res.status(401).json({ error: "Invalid credentials" });
    }
};
exports.login = login;
const verifyMfa = async (req, res) => {
    const { userId, code } = req.body;
    const ok = await authTokenService_1.authTokenService.consumeMfaChallenge(userId, code);
    if (!ok) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            const nextCount = user.failedLoginCount + 1;
            const lockoutUntil = nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { failedLoginCount: nextCount, lockoutUntil: lockoutUntil || undefined },
            });
        }
        return res.status(401).json({ error: "Invalid or expired MFA code" });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
    if (!user)
        return res.status(401).json({ error: "User not found" });
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockoutUntil: null },
    });
    const token = await authService_1.authService.issueTokenForUser(user, getRequestMeta(req));
    setRefreshCookie(res, token.refreshToken);
    return res.status(200).json(token);
};
exports.verifyMfa = verifyMfa;
const enableMfa = async (req, res) => {
    const user = req.user;
    const secret = crypto_1.default.randomBytes(16).toString("hex");
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true, mfaSecret: secret } });
    return res.status(200).json({ mfaEnabled: true });
};
exports.enableMfa = enableMfa;
const disableMfa = async (req, res) => {
    const user = req.user;
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: false, mfaSecret: null } });
    return res.status(200).json({ mfaEnabled: false });
};
exports.disableMfa = disableMfa;
const signup = async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const result = await authService_1.authService.register(email, password, name, role, undefined, getRequestMeta(req));
        const verifyToken = await authTokenService_1.authTokenService.createEmailVerification(result.user.id);
        mailerService_1.mailerService.sendEmailVerification(email, verifyToken).catch((e) => console.error("[verify-email error]", e));
        setRefreshCookie(res, result.refreshToken);
        return res.status(201).json(result);
    }
    catch (err) {
        console.error("[SIGNUP FAILED]", err);
        if (err.code === "EMAIL_TAKEN") {
            return res.status(409).json({ error: err.message });
        }
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Email already exists. Please use a different email or sign in." });
        }
        if (err.code === "P2021" || err.code === "P2022" || /column .* does not exist/i.test(err.message || "")) {
            return res.status(500).json({
                error: "Database schema is out of date. Please run `npx prisma migrate deploy` in the backend folder and restart the server.",
            });
        }
        if (err.code === "P1001" || /Can't reach database/i.test(err.message || "")) {
            return res.status(500).json({ error: "Cannot reach the database. Check your DATABASE_URL." });
        }
        return res.status(500).json({ error: err?.message || "Failed to create account" });
    }
};
exports.signup = signup;
const registerChurch = async (req, res) => {
    const { churchName, adminName, email, password } = req.body;
    try {
        const result = await authService_1.authService.registerChurch(churchName, adminName, email, password, getRequestMeta(req));
        const verifyToken = await authTokenService_1.authTokenService.createEmailVerification(result.user.id);
        mailerService_1.mailerService.sendEmailVerification(email, verifyToken).catch((e) => console.error("[verify-email error]", e));
        setRefreshCookie(res, result.refreshToken);
        return res.status(201).json(result);
    }
    catch (err) {
        console.error("[REGISTER CHURCH FAILED]", err);
        if (err?.code === "P2002") {
            return res.status(409).json({ error: "Email already exists. Please use a different email or sign in." });
        }
        if (err?.code === "P2021" || err?.code === "P2022" || /column .* does not exist/i.test(err?.message || "")) {
            return res.status(500).json({
                error: "Database schema is out of date. Please run `npx prisma migrate deploy` in the backend folder and restart the server.",
            });
        }
        if (err?.code === "P1001" || /Can't reach database/i.test(err?.message || "")) {
            return res.status(500).json({ error: "Cannot reach the database. Check your DATABASE_URL." });
        }
        return res.status(500).json({ error: err?.message || "Failed to create organization" });
    }
};
exports.registerChurch = registerChurch;
const logout = async (req, res) => {
    const presented = req.cookies?.[refreshTokenService_1.REFRESH_COOKIE_NAME];
    await authService_1.authService.logout(presented, req.user?.id);
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
};
exports.logout = logout;
const refresh = async (req, res) => {
    const presented = req.cookies?.[refreshTokenService_1.REFRESH_COOKIE_NAME];
    if (!presented)
        return res.status(401).json({ error: "No refresh token" });
    const pair = await authService_1.authService.refresh(presented, getRequestMeta(req));
    if (!pair) {
        clearRefreshCookie(res);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    setRefreshCookie(res, pair.refreshToken);
    return res.status(200).json(pair);
};
exports.refresh = refresh;
const me = async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    const fullUser = await authService_1.authService.getUserById(user.id);
    return res.status(200).json({ user: fullUser });
};
exports.me = me;
const updateProfile = async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Not authenticated" });
    const body = req.body;
    try {
        if (body.email && body.email !== user.email) {
            const existing = await prisma_1.prisma.user.findUnique({ where: { email: body.email } });
            if (existing && existing.id !== user.id) {
                return res.status(409).json({ error: "Email already in use" });
            }
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(body.name ? { name: body.name } : {}),
                ...(body.email ? { email: body.email, emailVerified: false } : {}),
            },
            include: { organization: true },
        });
        await auditService_1.auditService.log({ userId: user.id, action: "user.updateProfile", details: { changed: Object.keys(body) } });
        const serialized = await authService_1.authService.getUserById(updated.id);
        return res.status(200).json({ user: serialized });
    }
    catch (err) {
        if (err?.code === "P2002") {
            return res.status(409).json({ error: "Email already in use" });
        }
        return res.status(500).json({ error: err?.message || "Failed to update profile" });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Not authenticated" });
    const { currentPassword, newPassword } = req.body;
    const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser)
        return res.status(404).json({ error: "User not found" });
    const valid = await bcryptjs_1.default.compare(currentPassword, dbUser.password);
    if (!valid)
        return res.status(400).json({ error: "Current password is incorrect" });
    const newHash = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    await auditService_1.auditService.log({ userId: user.id, action: "user.changePassword", details: {} });
    return res.status(200).json({ message: "Password changed successfully" });
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const token = await authTokenService_1.authTokenService.createPasswordReset(email);
    if (token) {
        mailerService_1.mailerService.sendPasswordReset(email, token).catch((e) => console.error("[password-reset email error]", e));
    }
    return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const hash = await bcryptjs_1.default.hash(newPassword, 12);
    const ok = await authTokenService_1.authTokenService.consumePasswordReset(token, hash);
    if (!ok)
        return res.status(400).json({ error: "Invalid or expired token" });
    return res.status(200).json({ message: "Password reset successfully" });
};
exports.resetPassword = resetPassword;
const verifyEmail = async (req, res) => {
    const { token } = req.body;
    const ok = await authTokenService_1.authTokenService.consumeEmailVerification(token);
    if (!ok)
        return res.status(400).json({ error: "Invalid or expired token" });
    return res.status(200).json({ message: "Email verified" });
};
exports.verifyEmail = verifyEmail;
exports.authController = {
    login: exports.login,
    verifyMfa: exports.verifyMfa,
    enableMfa: exports.enableMfa,
    disableMfa: exports.disableMfa,
    signup: exports.signup,
    registerChurch: exports.registerChurch,
    logout: exports.logout,
    refresh: exports.refresh,
    me: exports.me,
    updateProfile: exports.updateProfile,
    changePassword: exports.changePassword,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    verifyEmail: exports.verifyEmail,
};
//# sourceMappingURL=authController.js.map