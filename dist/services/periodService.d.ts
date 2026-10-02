export declare const periodService: {
    list(organizationId: string): Promise<{
        id: string;
        organizationId: string;
        fiscalYear: number;
        month: number;
        isLocked: boolean;
        lockedById: string | null;
        lockedAt: Date | null;
        createdAt: Date;
    }[]>;
    get(fiscalYear: number, month: number, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        fiscalYear: number;
        month: number;
        isLocked: boolean;
        lockedById: string | null;
        lockedAt: Date | null;
        createdAt: Date;
    } | null>;
    lock(fiscalYear: number, month: number, organizationId: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        fiscalYear: number;
        month: number;
        isLocked: boolean;
        lockedById: string | null;
        lockedAt: Date | null;
        createdAt: Date;
    }>;
    unlock(fiscalYear: number, month: number, organizationId: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        fiscalYear: number;
        month: number;
        isLocked: boolean;
        lockedById: string | null;
        lockedAt: Date | null;
        createdAt: Date;
    }>;
    isLocked(fiscalYear: number, month: number, organizationId: string): Promise<boolean>;
};
//# sourceMappingURL=periodService.d.ts.map