import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { departmentService } from "../services/departmentService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const listDepartments = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const isDepartmentHead = user?.role === "DEPARTMENT_HEAD";
  const result = isDepartmentHead
    ? await departmentService.listForHead(params.page, params.pageSize, user!.id, user!.organizationId)
    : await departmentService.list(params.page, params.pageSize, user!.organizationId);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getDepartment = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const department = await departmentService.getById(req.params.id as string, user!.organizationId);
  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }
  return res.status(200).json(department);
};

export const createDepartment = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const department = await departmentService.create({ ...req.body, organizationId: user!.organizationId });
  return res.status(201).json(department);
};

export const updateDepartment = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const department = await departmentService.update(req.params.id as string, req.body, user!.organizationId);
  return res.status(200).json(department);
};

export const deleteDepartment = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await departmentService.delete(req.params.id as string, user!.organizationId);
  return res.status(204).send();
};

export const departmentController = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };