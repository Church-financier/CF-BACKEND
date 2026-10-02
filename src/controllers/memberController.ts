import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { memberService } from "../services/memberService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const listMembers = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const { search } = req.query as Record<string, string | undefined>;
  const result = await memberService.list(params.page, params.pageSize, user!.organizationId, search);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getMember = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const m = await memberService.getById(req.params.id as string, user!.organizationId);
  if (!m) return res.status(404).json({ error: "Member not found" });
  return res.status(200).json(m);
};

export const createMember = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { fullName: string; email?: string; phone?: string; address?: string; memberNumber?: string };
  const m = await memberService.create({
    organizationId: user!.organizationId,
    fullName: body.fullName,
    email: body.email || undefined,
    phone: body.phone,
    address: body.address,
    memberNumber: body.memberNumber,
  });
  return res.status(201).json(m);
};

export const updateMember = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { fullName?: string; email?: string; phone?: string; address?: string; memberNumber?: string; isActive?: boolean };
  const data: any = {};
  if (body.fullName !== undefined) data.fullName = body.fullName;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.address !== undefined) data.address = body.address;
  if (body.memberNumber !== undefined) data.memberNumber = body.memberNumber;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  const m = await memberService.update(req.params.id as string, data, user!.organizationId);
  return res.status(200).json(m);
};

export const deleteMember = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await memberService.delete(req.params.id as string, user!.organizationId);
  return res.status(204).send();
};

export const memberController = {
  listMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
};
