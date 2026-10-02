import { Request } from "express";

export const getClientIp = (req: Request): string | undefined => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    const firstPublic = ips.find((ip) => !isPrivateIp(ip));
    return firstPublic || ips[0];
  }
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    const firstPublic = xForwardedFor.find((ip) => !isPrivateIp(ip));
    return firstPublic || xForwardedFor[0];
  }

  const xRealIp = req.headers["x-real-ip"];
  if (typeof xRealIp === "string") return xRealIp;
  if (Array.isArray(xRealIp) && xRealIp.length > 0) return xRealIp[0];

  return req.ip || req.socket.remoteAddress || undefined;
};

const isPrivateIp = (ip: string): boolean => {
  if (!ip) return false;
  if (ip === "::1") return true;
  if (ip === "127.0.0.1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
};
