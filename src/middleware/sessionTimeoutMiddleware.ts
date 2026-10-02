import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { sessionActivity } from "../services/sessionActivity";
import { getOrgSettings } from "../services/systemSettingsService";

export const sessionInactivityMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return next();
  }

  const userId = user.id;

  if (!sessionActivity.isTracked(userId)) {
    try {
      const settings = await getOrgSettings(user.organizationId);
      const timeout = settings?.sessionTimeoutMinutes ?? 480;
      sessionActivity.touch(userId, timeout);
    } catch {
      sessionActivity.touch(userId);
    }
    return next();
  }

  if (sessionActivity.isExpired(userId)) {
    sessionActivity.revoke(userId);
    return res.status(401).json({
      error: "Session expired due to inactivity",
      code: "SESSION_EXPIRED",
    });
  }

  sessionActivity.touch(userId, sessionActivity.getTimeout(userId));
  next();
};
