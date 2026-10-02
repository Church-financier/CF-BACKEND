export interface CreateDisbursementInput {
    amountInKobo: bigint;
    purpose: string;
    requestedById: string;
    vendorId?: string;
    departmentId?: string;
    organizationId: string;
    lineItems?: Array<{
        description: string;
        amountInKobo: bigint;
        receiptUrl?: string;
    }>;
}
export declare const disbursementService: {
    createRequest(data: CreateDisbursementInput): Promise<{
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listRequests(organizationId: string, status?: string, page?: number, pageSize?: number, scopedDepartmentIds?: string[], departmentId?: string): Promise<{
        data: ({
            department: {
                id: string;
                name: string;
            } | null;
            firstApprovedBy: {
                email: string;
                name: string;
            } | null;
            lineItems: {
                id: string;
                organizationId: string;
                disbursementId: string;
                description: string;
                amountInKobo: bigint;
                receiptUrl: string | null;
                createdAt: Date;
            }[];
            requestedBy: {
                email: string;
                name: string;
            };
            secondApprovedBy: {
                email: string;
                name: string;
            } | null;
            vendor: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            organizationId: string;
            amountInKobo: bigint;
            purpose: string;
            requestedById: string;
            approvedById: string | null;
            firstApprovedById: string | null;
            secondApprovedById: string | null;
            vendorId: string | null;
            departmentId: string | null;
            status: import(".prisma/client").$Enums.DisbursementStatus;
            paymentMethod: string | null;
            paidAt: Date | null;
            paymentReference: string | null;
            paymentNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
    }>;
    getRequestById(id: string, organizationId: string): Promise<({
        approvedBy: {
            email: string;
            name: string;
        } | null;
        department: {
            id: string;
            organizationId: string;
            name: string;
            description: string | null;
            headId: string;
            createdAt: Date;
        } | null;
        firstApprovedBy: {
            email: string;
            name: string;
        } | null;
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
        requestedBy: {
            email: string;
            name: string;
        };
        secondApprovedBy: {
            email: string;
            name: string;
        } | null;
        vendor: {
            id: string;
            organizationId: string;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
            taxId: string | null;
            bankName: string | null;
            bankAccountName: string | null;
            bankAccountNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    firstApprove(id: string, approverId: string, organizationId: string): Promise<{
        firstApprovedBy: {
            email: string;
            name: string;
        } | null;
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
        secondApprovedBy: {
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    secondApprove(id: string, approverId: string, organizationId: string): Promise<{
        firstApprovedBy: {
            email: string;
            name: string;
        } | null;
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
        secondApprovedBy: {
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    rejectRequest(id: string, rejectedById: string, organizationId: string, reason?: string): Promise<{
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    markPaid(id: string, payerId: string, organizationId: string, paymentData: {
        paymentMethod: string;
        paymentReference?: string;
        paymentNotes?: string;
    }): Promise<{
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelDisbursement(id: string, cancelledById: string, organizationId: string, reason: string): Promise<{
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPendingCount(organizationId: string): Promise<number>;
    getDepartmentScopedRequests(organizationId: string, departmentIds: string[]): Promise<({
        lineItems: {
            id: string;
            organizationId: string;
            disbursementId: string;
            description: string;
            amountInKobo: bigint;
            receiptUrl: string | null;
            createdAt: Date;
        }[];
        requestedBy: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        amountInKobo: bigint;
        purpose: string;
        requestedById: string;
        approvedById: string | null;
        firstApprovedById: string | null;
        secondApprovedById: string | null;
        vendorId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.DisbursementStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
        paymentReference: string | null;
        paymentNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getVoucherData(id: string, organizationId: string): Promise<{
        voucherNumber: string;
        organizationName: string;
        organizationAddress: string | null | undefined;
        organizationPhone: string | null | undefined;
        organizationEmail: string | null | undefined;
        paidAt: Date;
        purpose: string;
        payeeName: string;
        payeeBankDetails: string[];
        amountInKobo: bigint;
        paymentMethod: string;
        paymentReference: string | null;
        paymentNotes: string | null;
        requestedBy: string;
        firstApprovedBy: string | null;
        secondApprovedBy: string | null;
        paidBy: string;
        lineItems: {
            description: string;
            amountInKobo: bigint;
        }[];
        organizationLogoUrl: string | null;
        currency: string;
        timezone: string | undefined;
    } | null>;
};
//# sourceMappingURL=disbursementService.d.ts.map