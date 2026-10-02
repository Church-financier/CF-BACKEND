export declare const budgetService: {
    create(data: {
        departmentId: string;
        fundId: string;
        fiscalYear: number;
        month: number;
        amountInKobo: bigint;
        organizationId: string;
    }): Promise<{
        department: {
            id: string;
            name: string;
        };
        fund: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        departmentId: string;
        fundId: string;
        fiscalYear: number;
        month: number;
        amountInKobo: bigint;
        createdAt: Date;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string, filters?: {
        departmentId?: string;
        fundId?: string;
        fiscalYear?: number;
    }): Promise<{
        data: ({
            department: {
                id: string;
                name: string;
            };
            fund: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            organizationId: string;
            departmentId: string;
            fundId: string;
            fiscalYear: number;
            month: number;
            amountInKobo: bigint;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<({
        department: {
            id: string;
            name: string;
        };
        fund: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        departmentId: string;
        fundId: string;
        fiscalYear: number;
        month: number;
        amountInKobo: bigint;
        createdAt: Date;
    }) | null>;
    update(id: string, organizationId: string, data: {
        departmentId?: string;
        fundId?: string;
        fiscalYear?: number;
        month?: number;
        amountInKobo?: bigint;
    }): Promise<({
        department: {
            id: string;
            name: string;
        };
        fund: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        departmentId: string;
        fundId: string;
        fiscalYear: number;
        month: number;
        amountInKobo: bigint;
        createdAt: Date;
    }) | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=budgetService.d.ts.map