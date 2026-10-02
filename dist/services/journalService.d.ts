export interface JournalLineInput {
    accountId: string;
    description?: string;
    debitInKobo: bigint;
    creditInKobo: bigint;
}
export interface JournalEntryInput {
    organizationId: string;
    date?: Date;
    description: string;
    reference?: string;
    createdById: string;
    lines: JournalLineInput[];
}
export declare const journalService: {
    createEntry(input: JournalEntryInput): Promise<{
        lines: ({
            account: {
                id: string;
                organizationId: string;
                code: string;
                name: string;
                type: import(".prisma/client").$Enums.AccountType;
                parentId: string | null;
                isActive: boolean;
                createdAt: Date;
            };
        } & {
            id: string;
            journalEntryId: string;
            accountId: string;
            description: string | null;
            debitInKobo: bigint;
            creditInKobo: bigint;
            createdAt: Date;
        })[];
    } & {
        id: string;
        organizationId: string;
        date: Date;
        description: string;
        reference: string | null;
        createdById: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JournalStatus;
    }>;
    listEntries(organizationId: string, page?: number, pageSize?: number): Promise<{
        data: ({
            lines: ({
                account: {
                    id: string;
                    organizationId: string;
                    code: string;
                    name: string;
                    type: import(".prisma/client").$Enums.AccountType;
                    parentId: string | null;
                    isActive: boolean;
                    createdAt: Date;
                };
            } & {
                id: string;
                journalEntryId: string;
                accountId: string;
                description: string | null;
                debitInKobo: bigint;
                creditInKobo: bigint;
                createdAt: Date;
            })[];
        } & {
            id: string;
            organizationId: string;
            date: Date;
            description: string;
            reference: string | null;
            createdById: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.JournalStatus;
        })[];
        total: number;
    }>;
    reverseEntry(id: string, reversedById: string, organizationId: string, reason: string): Promise<{
        lines: ({
            account: {
                id: string;
                organizationId: string;
                code: string;
                name: string;
                type: import(".prisma/client").$Enums.AccountType;
                parentId: string | null;
                isActive: boolean;
                createdAt: Date;
            };
        } & {
            id: string;
            journalEntryId: string;
            accountId: string;
            description: string | null;
            debitInKobo: bigint;
            creditInKobo: bigint;
            createdAt: Date;
        })[];
    } & {
        id: string;
        organizationId: string;
        date: Date;
        description: string;
        reference: string | null;
        createdById: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JournalStatus;
    }>;
    getTrialBalance(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]): Promise<{
        lines: {
            accountId: string;
            accountCode: string | undefined;
            accountName: string | undefined;
            accountType: import(".prisma/client").$Enums.AccountType | undefined;
            debitInKobo: string;
            creditInKobo: string;
            balance: string;
        }[];
        totals: {
            debit: string;
            credit: string;
        };
    }>;
};
//# sourceMappingURL=journalService.d.ts.map