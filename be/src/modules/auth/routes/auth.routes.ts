import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import { loginService } from "../services/auth.service";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";
import { findUserById } from "../repositories/auth.repository";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const result = await loginService(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(401)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  const user = await findUserById(req.user!.id);
  if (!user) {
    return res.status(404).json(fail("Không tìm thấy người dùng"));
  }

  return res.json(
    ok({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    })
  );
});
