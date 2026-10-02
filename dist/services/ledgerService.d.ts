export declare const ledgerService: {
    createEntry(data: {
        fundId: string;
        type: "DONATION" | "EXPENSE" | "TRANSFER";
        amountInKobo: bigint;
        description: string;
        recordedById: string;
        organizationId: string;
        memberId?: string;
    }): Promise<{
        id: string;
        organizationId: string;
        fundId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amountInKobo: bigint;
        description: string;
        recordedById: string;
        createdAt: Date;
        transactionDate: Date;
        memberId: string | null;
        contributionMethod: string | null;
        notes: string | null;
        journalId: string | null;
        reversedById: string | null;
    }>;
    listEntries(organizationId: string, fundId?: string, startDate?: string, endDate?: string, page?: number, pageSize?: number): Promise<{
        data: ({
            fund: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            organizationId: string;
            fundId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            amountInKobo: bigint;
            description: string;
            recordedById: string;
            createdAt: Date;
            transactionDate: Date;
            memberId: string | null;
            contributionMethod: string | null;
            notes: string | null;
            journalId: string | null;
            reversedById: string | null;
        })[];
        total: number;
    }>;
    getEntry(id: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        fundId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amountInKobo: bigint;
        description: string;
        recordedById: string;
        createdAt: Date;
        transactionDate: Date;
        memberId: string | null;
        contributionMethod: string | null;
        notes: string | null;
        journalId: string | null;
        reversedById: string | null;
    } | null>;
    reverseEntry(id: string, reversalReason: string, reversedById: string, organizationId: string): Promise<{
        original: {
            id: string;
            organizationId: string;
            fundId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            amountInKobo: bigint;
            description: string;
            recordedById: string;
            createdAt: Date;
            transactionDate: Date;
            memberId: string | null;
            contributionMethod: string | null;
            notes: string | null;
            journalId: string | null;
            reversedById: string;
        };
        reversal: {
            id: string;
            organizationId: string;
            fundId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            amountInKobo: bigint;
            description: string;
            recordedById: string;
            createdAt: Date;
            transactionDate: Date;
            memberId: string | null;
            contributionMethod: string | null;
            notes: string | null;
            journalId: string | null;
            reversedById: string | null;
        };
    }>;
    getFundBalance(fundId: string, organizationId: string): Promise<bigint>;
};
//# sourceMappingURL=ledgerService.d.ts.map