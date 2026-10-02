export declare const sessionActivity: {
    touch(userId: string, timeoutMinutes?: number): void;
    isExpired(userId: string): boolean;
    isTracked(userId: string): boolean;
    setTimeout(userId: string, timeoutMinutes: number): void;
    revoke(userId: string): void;
    getTimeout(userId: string): number;
};
//# sourceMappingURL=sessionActivity.d.ts.map