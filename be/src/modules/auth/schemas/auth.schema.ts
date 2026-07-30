import { z } from "zod";

export const loginInputSchema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});
