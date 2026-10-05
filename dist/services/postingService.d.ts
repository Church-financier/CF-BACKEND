import { type PrismaLike } from "./journalService";
export interface PostingParams {
    organizationId: string;
    createdById: string;
    amountInKobo: bigint;
    description: string;
    date?: Date;
    /**
     * Transaction client of the caller. When provided, the double entry is
     * written inside that transaction so the financial record and its journal
     * entry are atomic.
     */
    tx?: PrismaLike;
    ledgerEntryId?: string;
}
export declare function postContributionJournalEntry(params: {
    organizationId: string;
    createdById: string;
    amountInKobo: bigint;
    fundId: string;
    ledgerEntryId: string;
    description: string;
    date?: Date;
    tx?: PrismaLike;
}): Promise<void>;
export declare function postDisbursementJournalEntry(params: PostingParams): Promise<void>;
//# sourceMappingURL=postingService.d.ts.map