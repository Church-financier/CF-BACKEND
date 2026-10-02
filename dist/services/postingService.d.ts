export declare function postContributionJournalEntry(params: {
    organizationId: string;
    createdById: string;
    amountInKobo: bigint;
    fundId: string;
    ledgerEntryId: string;
    description: string;
    date?: Date;
}): Promise<void>;
export declare function postDisbursementJournalEntry(params: {
    organizationId: string;
    createdById: string;
    amountInKobo: bigint;
    description: string;
    date?: Date;
}): Promise<void>;
//# sourceMappingURL=postingService.d.ts.map