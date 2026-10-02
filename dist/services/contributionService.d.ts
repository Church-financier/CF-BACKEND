export interface ContributionInput {
    memberId?: string;
    memberName?: string;
    fundId: string;
    amountInKobo: bigint;
    type: "CASH" | "CHECK" | "ENVELOPE";
    date?: Date;
    notes?: string;
    recordedById: string;
    organizationId: string;
    pledgeId?: string;
}
export declare const contributionService: {
    listFunds(organizationId: string): Promise<{
        id: string;
        name: string;
    }[]>;
    createSingle(input: ContributionInput): Promise<{
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
    batchCreate(data: {
        entries: Array<{
            memberId?: string;
            memberName?: string;
            fundId: string;
            amountInKobo: bigint;
            type: "CASH" | "CHECK" | "ENVELOPE";
            date?: string;
            notes?: string;
            pledgeId?: string;
        }>;
        recordedById: string;
        organizationId: string;
    }): Promise<any[]>;
    listAll(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: ({
            fund: {
                name: string;
            };
            member: {
                fullName: string;
                id: string;
                memberNumber: string | null;
            } | null;
            pledgeContributions: {
                pledgeId: string;
            }[];
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
    getById(id: string, organizationId: string): Promise<({
        fund: {
            id: string;
            organizationId: string;
            name: string;
            description: string | null;
            isRestricted: boolean;
            createdAt: Date;
        };
        member: {
            id: string;
            organizationId: string;
            fullName: string;
            email: string | null;
            phone: string | null;
            address: string | null;
            memberNumber: string | null;
            joinedAt: Date;
            isActive: boolean;
            portalAccess: boolean;
            portalPasswordHash: string | null;
            createdAt: Date;
        } | null;
        recordedBy: {
            email: string;
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
    }) | null>;
    updateContribution(id: string, data: {
        memberId?: string;
        memberName?: string;
        fundId?: string;
        amountInKobo?: bigint;
        type?: "CASH" | "CHECK" | "ENVELOPE";
        date?: Date;
        notes?: string;
        pledgeId?: string;
    }, organizationId: string, recordedById: string): Promise<{
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
    deleteContribution(id: string, organizationId: string, recordedById: string, reason: string): Promise<{
        originalId: string;
        reversalId: string;
    }>;
    getMemberStatement(memberId: string, organizationId: string): Promise<{
        member: {
            fullName: string;
            id: string;
            memberNumber: string | null;
        };
        totalContributedInKobo: string;
        contributions: ({
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
    } | null>;
    getIncomeOverview(organizationId: string): Promise<{
        weeklyContributions: string;
        monthlyContributions: string;
        ytdContributions: string;
        outstandingPledges: string;
        memberCount: number;
        activePledges: number;
        categories: {
            fundId: string;
            name: string;
            amountInKobo: string;
        }[];
        memberStats: {
            amountInKobo: string;
            contributionCount: number;
            fullName: string;
            id: string;
            memberNumber: string | null;
        }[];
        recentEntries: ({
            fund: {
                id: string;
                name: string;
            };
            member: {
                fullName: string;
                id: string;
                memberNumber: string | null;
            } | null;
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
    }>;
    getReceiptData(ledgerEntryId: string, organizationId: string): Promise<{
        entryId: string;
        fundId: string;
        fundName: string;
        amountInKobo: string;
        date: Date;
        description: string;
        contributionMethod: string | null;
        recordedBy: {
            email: string;
            name: string;
        };
        organization: {
            id: string;
            name: string;
            address: string | null;
            phone: string | null;
            email: string | null;
            timezone: string;
            currency: string;
        };
    }>;
};
//# sourceMappingURL=contributionService.d.ts.map