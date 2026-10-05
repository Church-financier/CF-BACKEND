export interface IdempotencyRecordInput {
    key: string;
    userId: string;
    organizationId: string;
    endpoint: string;
    requestHash: string;
}
export type ClaimOutcome = {
    outcome: "proceed";
} | {
    outcome: "replay";
    status: number;
    body: unknown;
} | {
    outcome: "in_progress";
} | {
    outcome: "key_reuse";
};
export declare function isValidIdempotencyKey(key: string): boolean;
/**
 * Stable fingerprint of a request. Used to detect a key being replayed with a
 * different payload, which is a client bug rather than a retry.
 */
export declare function hashRequest(input: {
    method: string;
    path: string;
    body: unknown;
}): string;
export declare const idempotencyService: {
    /**
     * Claims a key for this request.
     *
     * - `proceed`      the caller owns the key and must later call `complete`
     *                  or `release`.
     * - `replay`       a previous identical request already succeeded; the stored
     *                  response is returned verbatim and nothing is re-executed.
     * - `in_progress`  an identical request is still running; the caller polls
     *                  briefly and then reports a conflict.
     * - `key_reuse`    the same key was sent with a different payload.
     */
    claim(input: IdempotencyRecordInput): Promise<ClaimOutcome>;
    /**
     * Waits for an in-flight duplicate to finish so a fast double-click gets the
     * cached response instead of a conflict. Returns `in_progress` if the
     * original is still running after the wait.
     */
    waitForCompletion(input: IdempotencyRecordInput): Promise<ClaimOutcome>;
    /** Persists the response so later replays of this key return it verbatim. */
    complete(organizationId: string, key: string, responseStatus: number, responseBody: unknown): Promise<void>;
    /**
     * Releases a claim whose request failed, so the client can retry the same
     * logical operation (failed requests are not cached).
     */
    release(organizationId: string, key: string): Promise<void>;
    /** Housekeeping: drops rows outside their replay window. */
    purgeExpired(): Promise<number>;
};
//# sourceMappingURL=idempotencyService.d.ts.map