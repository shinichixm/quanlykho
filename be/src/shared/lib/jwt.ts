import jwt from "jsonwebtoken";
import type { JwtPayload as AppJwtPayload } from "../../modules/auth/types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Thiếu biến môi trường JWT_SECRET");
}

const secret: string = JWT_SECRET;

export function signJwt(payload: AppJwtPayload, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): AppJwtPayload {
  return jwt.verify(token, secret) as unknown as AppJwtPayload;
}
