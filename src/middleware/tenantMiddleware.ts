import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "./authMiddleware";
import { getJwtSecret } from "../utils/jwt";

export interface TenantRequest extends AuthenticatedRequest {
  organizationId?: string;
}

export const tenantScoped = (req: TenantRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as Record<string, unknown>;
    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as string,
      organizationId: decoded.organizationId as string,
    };
    req.organizationId = decoded.organizationId as string | undefined;

    if (!req.organizationId) {
      return res.status(400).json({ error: "Organization ID missing from token" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireOrganization = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.organizationId) {
    return res.status(400).json({ error: "Organization context required" });
  }
  next();
};
