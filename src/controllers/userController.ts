import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { userService } from "../services/userService";

interface CreateUserBody {
  email: string;
  password: string;
  name: string;
  role?: string;
}

interface UpdateRoleBody {
  role: string;
}

export const listUsers = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const users = await userService.list(user!.organizationId);
  return res.status(200).json(users);
};

export const createUser = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { email, password, name, role } = req.body as CreateUserBody;
  const newUser = await userService.create({ email, password, name, role, organizationId: user!.organizationId });
  return res.status(201).json(newUser);
};

export const updateUserRole = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { role } = req.body as UpdateRoleBody;
  const updatedUser = await userService.updateRole(req.params.id as string, role, user!.organizationId);
  return res.status(200).json(updatedUser);
};

export const deleteUser = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await userService.delete(req.params.id as string, user!.organizationId);
  return res.status(200).json({ message: "User deleted successfully" });
};

export const userController = { listUsers, createUser, updateUserRole, deleteUser };
