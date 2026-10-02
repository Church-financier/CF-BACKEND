export interface AuditLogEntry {
    userId: string;
    action: string;
    details: Record<string, unknown>;
    ipAddress?: string | null;
    timestamp?: Date;
}
export declare const auditLogger: {
    log(entry: AuditLogEntry): Promise<{
        id: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    }>;
    logCreation(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    }>;
    logUpdate(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    }>;
    logDelete(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    }>;
    logVoid(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    }>;
};
//# sourceMappingURL=auditLogger.d.ts.map