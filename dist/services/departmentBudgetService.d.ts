import { DepartmentBudgetStatus } from "@prisma/client";
export declare const departmentBudgetService: {
    create(data: {
        budgetPeriodId: string;
        departmentId: string;
        submittedByUserId: string;
        organizationId: string;
    }): Promise<{
        department: {
            id: string;
            name: string;
        };
        items: ({
            category: {
                code: string;
                id: string;
                name: string;
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
        })[];
        submittedBy: {
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
    }>;
    getById(id: string, organizationId: string): Promise<({
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }) | null>;
    getByPeriodAndDepartment(budgetPeriodId: string, departmentId: string, organizationId: string): Promise<({
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }) | null>;
    listByPeriod(budgetPeriodId: string, organizationId: string): Promise<({
        department: {
            id: string;
            name: string;
        };
        items: ({
            category: {
                code: string;
                id: string;
                name: string;
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
        })[];
        submittedBy: {
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
    })[]>;
    listByUser(userId: string, organizationId: string): Promise<({
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
            category: {
                code: string;
                id: string;
                name: string;
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
        })[];
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
    })[]>;
    update(id: string, organizationId: string, data: {
        totalProposedAmount?: bigint;
        totalApprovedAmount?: bigint;
        status?: DepartmentBudgetStatus;
        rejectionNotes?: string | null;
    }): Promise<({
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }) | null>;
    recalculateTotals(id: string, organizationId: string): Promise<{
        totalProposedAmount: bigint;
        totalApprovedAmount: bigint;
    }>;
    submit(id: string, userId: string, organizationId: string): Promise<{
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }>;
    returnForRevision(id: string, organizationId: string, rejectionNotes: string): Promise<{
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }>;
    approve(id: string, organizationId: string, itemApprovals: {
        budgetItemId: string;
        approvedTotal: bigint;
    }[]): Promise<{
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }>;
    reject(id: string, organizationId: string, rejectionNotes: string): Promise<{
        budgetPeriod: {
            fiscalYear: number;
            id: string;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        };
        department: {
            id: string;
            name: string;
        };
        items: ({
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
        })[];
        submittedBy: {
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
    }>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=departmentBudgetService.d.ts.map