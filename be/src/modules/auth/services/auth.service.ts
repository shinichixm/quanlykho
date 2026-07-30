import bcrypt from "bcryptjs";
import { signJwt } from "../../../shared/lib/jwt";
import { loginInputSchema } from "../schemas/auth.schema";
import { findUserByUsername } from "../repositories/auth.repository";
import { JWT_EXPIRES_IN } from "../constants/auth.constants";
import type { LoginInput, LoginResult } from "../types/auth.types";

export async function loginService(input: LoginInput): Promise<LoginResult> {
  const parsed = loginInputSchema.parse(input);

  const user = await findUserByUsername(parsed.username);
  if (!user || !user.isActive) {
    throw new Error("Tài khoản hoặc mật khẩu không đúng");
  }

  const passwordMatch = await bcrypt.compare(parsed.password, user.password);
  if (!passwordMatch) {
    throw new Error("Tài khoản hoặc mật khẩu không đúng");
  }

  const token = signJwt({ sub: user.id, role: user.role }, JWT_EXPIRES_IN);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
}
