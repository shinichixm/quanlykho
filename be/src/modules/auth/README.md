# Module auth

Đăng nhập và xác thực người dùng.

## API
- `POST /api/auth/login` — `{ username, password }` → `{ token, user }`
- `GET /api/auth/me` — cần header `Authorization: Bearer <token>` → thông tin user hiện tại

## DB
Model `User` (`be/prisma/schema.prisma`). Đăng nhập bằng `username` (unique), không dùng `email`. Mật khẩu lưu dạng bcrypt hash.

## Ghi chú
- Token JWT ký bằng `JWT_SECRET` (env), hết hạn sau 7 ngày (`auth.constants.ts`).
- `shared/middleware/auth.middleware.ts` verify token cho mọi route cần đăng nhập.
