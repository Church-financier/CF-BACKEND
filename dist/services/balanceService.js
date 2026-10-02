"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFundBalances = computeFundBalances;
exports.sumBalances = sumBalances;
const prisma_1 = require("../lib/prisma");
function emptyBalance(fundId) {
    return {
        fundId,
        inflowInKobo: BigInt(0),
        outflowInKobo: BigInt(0),
        balanceInKobo: BigInt(0),
    };
}
/**
 * Signed cash effect of a ledger row.
 *
 * Reversal rows are stored with a negative amount and the original row is
 * excluded from queries by the `reversedById: null` filter, so a reversal has
 * to be evaluated against the type of the entry it reverses rather than its own.
 */
function signedAmount(type, amountInKobo) {
    return type === "EXPENSE" ? -amountInKobo : amountInKobo;
}
async function computeFundBalances(organizationId, fundIds) {
    const entries = await prisma_1.prisma.ledgerEntry.findMany({
        // `fundIds` is undefined for organization-wide callers and an array for
        // scoped ones. An empty array must produce no rows, not all rows.
        where: {
            organizationId,
            reversedById: null,
            ...(fundIds === undefined ? {} : { fundId: { in: fundIds } }),
        },
        select: {
            fundId: true,
            type: true,
            amountInKobo: true,
            reversals: { select: { type: true }, take: 1 },
        },
    });
    const balances = new Map();
    for (const row of entries) {
        let balance = balances.get(row.fundId);
        if (!balance) {
            balance = emptyBalance(row.fundId);
            balances.set(row.fundId, balance);
        }
        const effectiveType = row.type === "REVERSAL" ? row.reversals[0]?.type ?? "EXPENSE" : row.type;
        const signed = signedAmount(effectiveType, row.amountInKobo);
        if (signed >= BigInt(0)) {
            balance.inflowInKobo += signed;
        }
        else {
            balance.outflowInKobo += -signed;
        }
        balance.balanceInKobo += signed;
    }
    return balances;
}
function sumBalances(balances) {
    const total = emptyBalance("__total__");
    for (const balance of balances) {
        total.inflowInKobo += balance.inflowInKobo;
        total.outflowInKobo += balance.outflowInKobo;
        total.balanceInKobo += balance.balanceInKobo;
    }
    return total;
}
//# sourceMappingURL=balanceService.js.map