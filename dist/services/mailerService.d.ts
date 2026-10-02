interface SendArgs {
    to: string;
    subject: string;
    text: string;
    html?: string;
}
export declare const mailerService: {
    isConfigured(): boolean;
    send({ to, subject, text, html }: SendArgs): Promise<{
        delivered: boolean;
        channel: "smtp" | "console";
        error?: string;
    }>;
    sendPasswordReset(email: string, token: string): Promise<void>;
    sendEmailVerification(email: string, token: string): Promise<void>;
    sendMfaCode(email: string, code: string): Promise<void>;
    sendReceipt(args: {
        email: string;
        donorName: string;
        amountInKobo: string | number;
        fundName: string;
        receiptNumber: string;
        date: Date;
        organizationName: string;
        currency?: string | null;
    }): Promise<void>;
};
export {};
//# sourceMappingURL=mailerService.d.ts.map