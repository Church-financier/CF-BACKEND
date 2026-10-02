import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listMembers: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMember: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMember: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMember: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMember: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const memberController: {
    listMembers: typeof listMembers;
    getMember: typeof getMember;
    createMember: typeof createMember;
    updateMember: typeof updateMember;
    deleteMember: typeof deleteMember;
};
//# sourceMappingURL=memberController.d.ts.map