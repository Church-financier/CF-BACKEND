export declare const refreshTokenService: {
    issue(userId: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    rotate(presentedToken: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        token: string;
        expiresAt: Date;
        userId: string;
    } | null>;
    revoke(presentedToken: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
};
export declare const REFRESH_COOKIE_NAME = "cf_refresh";
export declare const REFRESH_COOKIE_MAX_AGE_MS: number;
export declare function refreshCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
};
//# sourceMappingURL=refreshTokenService.d.ts.map