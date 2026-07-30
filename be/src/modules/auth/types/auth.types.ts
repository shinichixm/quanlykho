export type LoginInput = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

export type JwtPayload = {
  sub: number;
  role: "ADMIN" | "STAFF";
};
