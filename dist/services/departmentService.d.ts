export declare const departmentService: {
    create(data: {
        name: string;
        description?: string;
        headId: string;
        organizationId: string;
    }): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        headId: string;
        createdAt: Date;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: ({
            head: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            organizationId: string;
            name: string;
            description: string | null;
            headId: string;
            createdAt: Date;
        })[];
        total: number;
    }>;
    listForHead(page: number | undefined, pageSize: number | undefined, headId: string, organizationId: string): Promise<{
        data: ({
            head: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            organizationId: string;
            name: string;
            description: string | null;
            headId: string;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<({
        head: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        headId: string;
        createdAt: Date;
    }) | null>;
    update(id: string, data: {
        name?: string;
        description?: string;
        headId?: string;
    }, organizationId: string): Promise<({
        head: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        headId: string;
        createdAt: Date;
    }) | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=departmentService.d.ts.map