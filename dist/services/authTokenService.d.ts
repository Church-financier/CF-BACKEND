export declare const authTokenService: {
    createPasswordReset(email: string): Promise<string | null>;
    consumePasswordReset(token: string, newPasswordHash: string): Promise<boolean>;
    createEmailVerification(userId: string): Promise<string>;
    consumeEmailVerification(token: string): Promise<boolean>;
    createMfaChallenge(userId: string): Promise<string>;
    consumeMfaChallenge(userId: string, code: string): Promise<boolean>;
};
//# sourceMappingURL=authTokenService.d.ts.map