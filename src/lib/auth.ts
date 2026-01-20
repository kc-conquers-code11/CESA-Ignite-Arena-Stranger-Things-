// src/lib/auth.ts
import { api } from "./api";

export const loginApi = (data: {
  email: string;
  password: string;
}) => {
  return api.post("/auth/login", data);
};
export const signupApi = (data: any) => {
  return api.post("/auth/signup", data);
};

