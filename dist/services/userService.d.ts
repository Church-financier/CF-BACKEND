export declare const userService: {
    list(organizationId: string): Promise<{
        createdAt: Date;
        email: string;
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    getById(id: string, organizationId: string): Promise<{
        createdAt: Date;
        email: string;
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    } | null>;
    create(data: {
        email: string;
        password: string;
        name: string;
        role?: string;
        organizationId: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateRole(id: string, role: string, organizationId: string): Promise<{
        createdAt: Date;
        email: string;
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    } | null>;
    delete(id: string, organizationId: string): Promise<void>;
};
//# sourceMappingURL=userService.d.ts.map