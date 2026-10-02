export declare const memberService: {
    create(data: {
        organizationId: string;
        fullName: string;
        email?: string;
        phone?: string;
        address?: string;
        memberNumber?: string;
    }): Promise<{
        address: string | null;
        createdAt: Date;
        email: string | null;
        fullName: string;
        id: string;
        isActive: boolean;
        joinedAt: Date;
        memberNumber: string | null;
        phone: string | null;
        portalAccess: boolean;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string, search?: string): Promise<{
        data: {
            address: string | null;
            createdAt: Date;
            email: string | null;
            fullName: string;
            id: string;
            isActive: boolean;
            joinedAt: Date;
            memberNumber: string | null;
            phone: string | null;
            portalAccess: boolean;
        }[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<{
        address: string | null;
        createdAt: Date;
        email: string | null;
        fullName: string;
        id: string;
        isActive: boolean;
        joinedAt: Date;
        memberNumber: string | null;
        phone: string | null;
        portalAccess: boolean;
    } | null>;
    update(id: string, data: any, organizationId: string): Promise<{
        address: string | null;
        createdAt: Date;
        email: string | null;
        fullName: string;
        id: string;
        isActive: boolean;
        joinedAt: Date;
        memberNumber: string | null;
        phone: string | null;
        portalAccess: boolean;
    } | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=memberService.d.ts.map