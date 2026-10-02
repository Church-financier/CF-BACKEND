"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalAuthenticate = exports.PORTAL_COOKIE_NAME = exports.portalAuthService = void 0;
exports.portalCookieOptions = portalCookieOptions;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
function signPortalToken(payload) {
    return jsonwebtoken_1.default.sign(payload, (0, jwt_1.getJwtSecret)(), { expiresIn: "7d" });
}
exports.portalAuthService = {
    async issueForMember(memberId) {
        const member = await prisma_1.prisma.member.findUnique({ where: { id: memberId } });
        if (!member || !member.portalAccess || !member.email)
            throw new Error("Member cannot access portal");
        const token = signPortalToken({
            memberId: member.id,
            organizationId: member.organizationId,
            email: member.email,
            type: "member-portal",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ memberId: member.id, organizationId: member.organizationId, type: "member-portal-refresh" }, (0, jwt_1.getJwtSecret)(), { expiresIn: "30d" });
        return { token, refreshToken };
    },
    verifyPortalToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
            if (decoded?.type !== "member-portal")
                return null;
            return decoded;
        }
        catch {
            return null;
        }
    },
    verifyPortalRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
            if (decoded?.type !== "member-portal-refresh")
                return null;
            return { memberId: decoded.memberId, organizationId: decoded.organizationId };
        }
        catch {
            return null;
        }
    },
};
exports.PORTAL_COOKIE_NAME = "cf_portal_refresh";
function portalCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };
}
const portalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else if (req.cookies?.["cf_portal"]) {
        token = req.cookies["cf_portal"];
    }
    if (!token)
        return res.status(401).json({ error: "Not authenticated" });
    const payload = exports.portalAuthService.verifyPortalToken(token);
    if (!payload)
        return res.status(401).json({ error: "Invalid or expired token" });
    const member = await prisma_1.prisma.member.findUnique({ where: { id: payload.memberId } });
    if (!member || !member.portalAccess || member.email !== payload.email) {
        return res.status(401).json({ error: "Portal access revoked" });
    }
    req.portalMember = {
        id: member.id,
        organizationId: member.organizationId,
        email: member.email,
        fullName: member.fullName,
    };
    next();
};
exports.portalAuthenticate = portalAuthenticate;
//# sourceMappingURL=portalAuthService.js.map