import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { vendorService } from "../services/vendorService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const listVendors = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const result = await vendorService.list(params.page, params.pageSize, user!.organizationId);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getVendor = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const vendor = await vendorService.getById(req.params.id as string, user!.organizationId);
  if (!vendor) {
    return res.status(404).json({ error: "Vendor not found" });
  }
  return res.status(200).json(vendor);
};

export const createVendor = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as Record<string, unknown>;
  const vendor = await vendorService.create({
    name: body.name as string,
    email: body.email as string | undefined,
    phone: body.phone as string | undefined,
    address: body.address as string | undefined,
    taxId: body.taxId as string | undefined,
    bankName: body.bankName as string | undefined,
    bankAccountName: body.bankAccountName as string | undefined,
    bankAccountNumber: body.bankAccountNumber as string | undefined,
    organizationId: user!.organizationId,
  });
  return res.status(201).json(vendor);
};

export const updateVendor = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as Record<string, unknown>;
  const vendor = await vendorService.update(req.params.id as string, {
    name: body.name as string | undefined,
    email: body.email as string | undefined,
    phone: body.phone as string | undefined,
    address: body.address as string | undefined,
    taxId: body.taxId as string | undefined,
    bankName: body.bankName as string | undefined,
    bankAccountName: body.bankAccountName as string | undefined,
    bankAccountNumber: body.bankAccountNumber as string | undefined,
  }, user!.organizationId);
  return res.status(200).json(vendor);
};

export const deleteVendor = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await vendorService.delete(req.params.id as string, user!.organizationId);
  return res.status(204).send();
};

export const vendorController = { listVendors, getVendor, createVendor, updateVendor, deleteVendor };
