"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrganization = exports.tenantScoped = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const tenantScoped = (req, res, next) => {
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
        req.organizationId = decoded.organizationId;
        if (!req.organizationId) {
            return res.status(400).json({ error: "Organization ID missing from token" });
        }
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.tenantScoped = tenantScoped;
const requireOrganization = (req, res, next) => {
    if (!req.organizationId) {
        return res.status(400).json({ error: "Organization context required" });
    }
    next();
};
exports.requireOrganization = requireOrganization;
//# sourceMappingURL=tenantMiddleware.js.map