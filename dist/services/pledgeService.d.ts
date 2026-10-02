export declare const pledgeService: {
    create(data: {
        memberId?: string;
        memberName: string;
        fundId: string;
        amountInKobo: bigint;
        startDate?: string;
        endDate?: string;
        recurring?: boolean;
        organizationId: string;
    }): Promise<{
        id: string;
        organizationId: string;
        memberId: string | null;
        memberName: string;
        fundId: string;
        amountInKobo: bigint;
        startDate: Date | null;
        endDate: Date | null;
        recurring: boolean;
        status: import(".prisma/client").$Enums.PledgeStatus;
        createdAt: Date;
    }>;
    listAll(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: {
            id: string;
            organizationId: string;
            memberId: string | null;
            memberName: string;
            fundId: string;
            amountInKobo: bigint;
            startDate: Date | null;
            endDate: Date | null;
            recurring: boolean;
            createdAt: Date;
            status: string;
            totalReceivedInKobo: string;
            remainingInKobo: string;
            fulfilled: boolean;
            fund: {
                name: string;
            };
            member: {
                id: string;
                memberNumber: string | null;
            } | null;
        }[];
        total: number;
    }>;
    listByMember(memberId: string, page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: ({
            fund: {
                name: string;
            };
        } & {
            id: string;
            organizationId: string;
            memberId: string | null;
            memberName: string;
            fundId: string;
            amountInKobo: bigint;
            startDate: Date | null;
            endDate: Date | null;
            recurring: boolean;
            status: import(".prisma/client").$Enums.PledgeStatus;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<({
        contributions: ({
            ledgerEntry: {
                createdAt: Date;
                id: string;
            };
        } & {
            id: string;
            organizationId: string;
            pledgeId: string;
            ledgerEntryId: string;
            amountInKobo: bigint;
            recordedById: string;
            createdAt: Date;
        })[];
        fund: {
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        memberId: string | null;
        memberName: string;
        fundId: string;
        amountInKobo: bigint;
        startDate: Date | null;
        endDate: Date | null;
        recurring: boolean;
        status: import(".prisma/client").$Enums.PledgeStatus;
        createdAt: Date;
    }) | null>;
    update(id: string, data: {
        memberId?: string;
        memberName?: string;
        fundId?: string;
        amountInKobo?: bigint;
        startDate?: string;
        endDate?: string;
        recurring?: boolean;
    }, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        memberId: string | null;
        memberName: string;
        fundId: string;
        amountInKobo: bigint;
        startDate: Date | null;
        endDate: Date | null;
        recurring: boolean;
        status: import(".prisma/client").$Enums.PledgeStatus;
        createdAt: Date;
    } | null>;
    cancel(id: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        memberId: string | null;
        memberName: string;
        fundId: string;
        amountInKobo: bigint;
        startDate: Date | null;
        endDate: Date | null;
        recurring: boolean;
        status: import(".prisma/client").$Enums.PledgeStatus;
        createdAt: Date;
    } | null>;
    getProgress(pledgeId: string, organizationId: string): Promise<{
        pledged: string;
        received: string;
        remaining: string;
        percentage: number;
        fulfilled: boolean;
    }>;
};
//# sourceMappingURL=pledgeService.d.ts.map