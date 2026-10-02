import { Request, Response, NextFunction } from "express";
export interface PortalTokenPayload {
    memberId: string;
    organizationId: string;
    email: string;
    type: "member-portal";
}
export interface PortalRequest extends Request {
    portalMember?: {
        id: string;
        organizationId: string;
        email: string;
        fullName: string;
    };
}
export declare const portalAuthService: {
    issueForMember(memberId: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    verifyPortalToken(token: string): PortalTokenPayload | null;
    verifyPortalRefreshToken(token: string): {
        memberId: string;
        organizationId: string;
    } | null;
};
export declare const PORTAL_COOKIE_NAME = "cf_portal_refresh";
export declare function portalCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
};
export declare const portalAuthenticate: (req: PortalRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=portalAuthService.d.ts.map