"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            organizationId: decoded.organizationId,
        };
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=authMiddleware.js.map