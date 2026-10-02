"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.auditLogger = {
    async log(entry) {
        return prisma.auditLog.create({
            data: {
                userId: entry.userId,
                action: entry.action,
                details: entry.details,
                ipAddress: entry.ipAddress,
                createdAt: entry.timestamp || new Date(),
            },
        });
    },
    async logCreation(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `CREATE_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logUpdate(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `UPDATE_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logDelete(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `DELETE_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logVoid(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `VOID_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
};
//# sourceMappingURL=auditLogger.js.map