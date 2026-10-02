import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};
