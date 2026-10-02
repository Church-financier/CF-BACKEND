export declare const budgetItemService: {
    create(data: {
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description?: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal?: bigint | null;
        organizationId: string;
    }): Promise<{
        category: {
            code: string;
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
        };
    } & {
        id: string;
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Active expense accounts, for categorising budget line items.
     *
     * A department head needs to pick an expense category when building their
     * budget, but has no business browsing the whole chart of accounts. This
     * exposes just the fields the picker needs under `budget:read`.
     */
    listExpenseCategories(organizationId: string): Promise<{
        code: string;
        id: string;
        name: string;
    }[]>;
    getById(id: string, organizationId: string): Promise<({
        category: {
            code: string;
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
        };
        departmentBudget: {
            budgetPeriod: {
                fiscalYear: number;
                id: string;
                status: import(".prisma/client").$Enums.BudgetPeriodStatus;
            };
            department: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            budgetPeriodId: string;
            departmentId: string;
            submittedByUserId: string;
            totalProposedAmount: bigint;
            totalApprovedAmount: bigint;
            status: import(".prisma/client").$Enums.DepartmentBudgetStatus;
            rejectionNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    listByDepartmentBudget(departmentBudgetId: string, organizationId: string): Promise<({
        category: {
            code: string;
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
        };
    } & {
        id: string;
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    update(id: string, organizationId: string, data: {
        categoryId?: string;
        itemName?: string;
        description?: string | null;
        unitCost?: bigint;
        quantity?: number;
        proposedTotal?: bigint;
        approvedTotal?: bigint | null;
    }): Promise<({
        category: {
            code: string;
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
        };
        departmentBudget: {
            budgetPeriod: {
                fiscalYear: number;
                id: string;
                status: import(".prisma/client").$Enums.BudgetPeriodStatus;
            };
            department: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            budgetPeriodId: string;
            departmentId: string;
            submittedByUserId: string;
            totalProposedAmount: bigint;
            totalApprovedAmount: bigint;
            status: import(".prisma/client").$Enums.DepartmentBudgetStatus;
            rejectionNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    updateApprovedTotal(id: string, organizationId: string, approvedTotal: bigint): Promise<({
        category: {
            code: string;
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
        };
        departmentBudget: {
            budgetPeriod: {
                fiscalYear: number;
                id: string;
                status: import(".prisma/client").$Enums.BudgetPeriodStatus;
            };
            department: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            budgetPeriodId: string;
            departmentId: string;
            submittedByUserId: string;
            totalProposedAmount: bigint;
            totalApprovedAmount: bigint;
            status: import(".prisma/client").$Enums.DepartmentBudgetStatus;
            rejectionNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        departmentBudgetId: string;
        categoryId: string;
        itemName: string;
        description: string | null;
        unitCost: bigint;
        quantity: number;
        proposedTotal: bigint;
        approvedTotal: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    bulkUpdateApprovedTotals(organizationId: string, updates: {
        budgetItemId: string;
        approvedTotal: bigint;
    }[]): Promise<void>;
};
//# sourceMappingURL=budgetItemService.d.ts.map