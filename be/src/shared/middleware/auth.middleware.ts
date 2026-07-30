import type { NextFunction, Request, Response } from "express";
import { fail } from "../lib/api-response";
import { verifyJwt } from "../lib/jwt";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json(fail("Chưa đăng nhập"));
  }

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json(fail("Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));
  }
}
