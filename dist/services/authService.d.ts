export interface TokenPair {
    token: string;
    refreshToken: string;
    refreshExpiresAt: Date;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        organizationId: string;
        organizationName: string;
    };
}
export declare const authService: {
    register(email: string, password: string, name: string, role?: string, organizationId?: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair>;
    registerChurch(churchName: string, adminName: string, email: string, password: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair>;
    authenticate(email: string, password: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair>;
    getUserById(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string;
        organizationName: string;
        emailVerified: boolean;
        mfaEnabled: boolean;
        createdAt: Date;
    } | null>;
    issueTokenForUser(user: {
        id: string;
        email: string;
        name: string;
        role: string;
        organizationId: string;
        organization: {
            name: string;
            sessionTimeoutMinutes: number;
        };
    }, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair>;
    refresh(presentedToken: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair | null>;
    logout(presentedToken?: string, userId?: string): Promise<void>;
};
//# sourceMappingURL=authService.d.ts.map