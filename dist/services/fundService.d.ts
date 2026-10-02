export declare const fundService: {
    create(data: {
        name: string;
        description?: string;
        isRestricted?: boolean;
        organizationId: string;
    }): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        isRestricted: boolean;
        createdAt: Date;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: {
            id: string;
            organizationId: string;
            name: string;
            description: string | null;
            isRestricted: boolean;
            createdAt: Date;
            inflowInKobo: bigint;
            outflowInKobo: bigint;
            balanceInKobo: bigint;
        }[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        isRestricted: boolean;
        createdAt: Date;
    } | null>;
    update(id: string, data: Partial<{
        name: string;
        description: string;
        isRestricted: boolean;
    }>, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        isRestricted: boolean;
        createdAt: Date;
    } | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getBalance(fundId: string, organizationId: string): Promise<bigint>;
};
//# sourceMappingURL=fundService.d.ts.map