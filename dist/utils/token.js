"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.hashTokenValue = hashTokenValue;
exports.tokenExpiry = tokenExpiry;
const crypto_1 = __importDefault(require("crypto"));
const TOKEN_TTL_HOURS = 24;
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
function generateToken() {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    return { token, tokenHash: hashToken(token) };
}
function hashTokenValue(token) {
    return hashToken(token);
}
function tokenExpiry() {
    return new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
}
//# sourceMappingURL=token.js.map