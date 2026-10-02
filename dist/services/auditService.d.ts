export declare const auditService: {
    log(data: {
        userId: string;
        action: string;
        details: Record<string, unknown>;
        ipAddress?: string;
        organizationId?: string;
    }): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    } | null>;
    logCreation(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    } | null>;
    logUpdate(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    } | null>;
    logDelete(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    } | null>;
    logVoid(entity: string, entityId: string, userId: string, ipAddress?: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        createdAt: Date;
    } | null>;
    list(organizationId: string, filters: {
        userId?: string;
        action?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: ({
            user: {
                email: string;
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            action: string;
            details: import("@prisma/client/runtime/library").JsonValue;
            ipAddress: string | null;
            createdAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
};
//# sourceMappingURL=auditService.d.ts.map