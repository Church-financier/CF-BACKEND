import { prisma } from "../lib/prisma";
/** Either the root client or an interactive-transaction client. */
export type PrismaLike = Pick<typeof prisma, "$queryRaw"> & Record<string, any>;
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
    /**
     * @param client optional transaction client. When supplied the double entry
     * is written inside the caller's transaction, so a financial routine and its
     * journal entry commit or roll back together.
     */
    createEntry(input: JournalEntryInput, client?: PrismaLike): Promise<any>;
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
    /**
     * Reversal runs in a single SERIALIZABLE transaction with the original entry
     * locked FOR UPDATE, so two concurrent reversals of the same journal cannot
     * both post a reversing double entry.
     */
    reverseEntry(id: string, reversedById: string, organizationId: string, reason: string): Promise<any>;
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