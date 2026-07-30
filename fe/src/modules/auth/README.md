# Module auth (FE)

Đăng nhập và bảo vệ route.

## Thành phần
- `components/LoginForm.tsx` — form đăng nhập, dùng ở `app/login/page.tsx`
- `components/AuthGuard.tsx` — bọc các trang cần đăng nhập (dùng trong `app/(app)/layout.tsx`), redirect về `/login` nếu chưa có token
- `hooks/useAuth.ts` — `login`, `logout`, `user`, `loading`
- `services/auth.api.ts` — gọi `POST /api/auth/login`
- `services/token-storage.ts` — lưu token/user vào `localStorage`

## Ghi chú
- Token lưu ở `localStorage`, không phải cookie — phù hợp cho ứng dụng nội bộ, chưa cần SSR-protected route.
