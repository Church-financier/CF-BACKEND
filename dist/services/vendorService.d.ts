export interface VendorInput {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
}
export type VendorUpdateInput = Partial<VendorInput>;
export declare const vendorService: {
    create(data: VendorInput & {
        organizationId: string;
    }): Promise<{
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
    }>;
    list(page: number | undefined, pageSize: number | undefined, organizationId: string): Promise<{
        data: {
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
        }[];
        total: number;
    }>;
    getById(id: string, organizationId: string): Promise<{
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
    } | null>;
    update(id: string, data: VendorUpdateInput, organizationId: string): Promise<{
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
    } | null>;
    delete(id: string, organizationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=vendorService.d.ts.map