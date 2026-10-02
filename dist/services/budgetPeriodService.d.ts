import { BudgetPeriodStatus } from "@prisma/client";
export declare const budgetPeriodService: {
    create(data: {
        fiscalYear: number;
        submissionDeadline?: Date;
        organizationId: string;
    }): Promise<{
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: ({
            departmentBudgets: ({
                department: {
                    id: string;
                    name: string;
                };
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
            })[];
        } & {
            id: string;
            organizationId: string;
            fiscalYear: number;
            status: import(".prisma/client").$Enums.BudgetPeriodStatus;
            submissionDeadline: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<({
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getActive(organizationId: string): Promise<({
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getByFiscalYear(fiscalYear: number, organizationId: string): Promise<({
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(id: string, organizationId: string, data: {
        fiscalYear?: number;
        status?: BudgetPeriodStatus;
        submissionDeadline?: Date | null;
    }): Promise<({
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    openSubmission(id: string, organizationId: string, submissionDeadline: Date): Promise<{
        departmentBudgets: ({
            department: {
                id: string;
                name: string;
            };
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    closeSubmission(id: string, organizationId: string): Promise<{
        departmentBudgets: ({
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
        })[];
    } & {
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    approveAndLock(id: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        fiscalYear: number;
        status: import(".prisma/client").$Enums.BudgetPeriodStatus;
        submissionDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=budgetPeriodService.d.ts.map