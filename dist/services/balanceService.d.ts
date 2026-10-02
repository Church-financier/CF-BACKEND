export interface FundBalance {
    fundId: string;
    inflowInKobo: bigint;
    outflowInKobo: bigint;
    balanceInKobo: bigint;
}
export declare function computeFundBalances(organizationId: string, fundIds?: string[]): Promise<Map<string, FundBalance>>;
export declare function sumBalances(balances: Iterable<FundBalance>): FundBalance;
//# sourceMappingURL=balanceService.d.ts.map