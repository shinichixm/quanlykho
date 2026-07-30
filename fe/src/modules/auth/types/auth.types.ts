export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
};

export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};
