import { AccountType } from "@prisma/client";
export declare const chartOfAccountsService: {
    create(data: {
        code: string;
        name: string;
        type: AccountType;
        parentAccountCode?: string;
        parentId?: string;
        isActive?: boolean;
        organizationId: string;
    }): Promise<{
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import(".prisma/client").$Enums.AccountType;
        parentId: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: ({
            parent: {
                id: string;
                organizationId: string;
                code: string;
                name: string;
                type: import(".prisma/client").$Enums.AccountType;
                parentId: string | null;
                isActive: boolean;
                createdAt: Date;
            } | null;
        } & {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<({
        children: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        parent: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        } | null;
    } & {
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import(".prisma/client").$Enums.AccountType;
        parentId: string | null;
        isActive: boolean;
        createdAt: Date;
    }) | null>;
    listChildren(parentId: string | null, page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
    }>;
    update(id: string, data: {
        code?: string;
        name?: string;
        type?: AccountType;
        parentId?: string;
        isActive?: boolean;
    }, organizationId: string): Promise<({
        children: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        parent: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            parentId: string | null;
            isActive: boolean;
            createdAt: Date;
        } | null;
    } & {
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import(".prisma/client").$Enums.AccountType;
        parentId: string | null;
        isActive: boolean;
        createdAt: Date;
    }) | null>;
    delete(id: string, organizationId: string): Promise<void>;
};
//# sourceMappingURL=chartOfAccountsService.d.ts.map