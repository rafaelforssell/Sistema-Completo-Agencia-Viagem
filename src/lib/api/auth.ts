import { http } from "@/lib/http";
import type { Admin, LoginPayload } from "@/types/entities";

export const authApi = {
  login: (payload: LoginPayload) =>
    http.post<{ admin: Admin | null }>("/auth/login", payload),
  logout: () => http.post<{ ok: true }>("/auth/logout"),
  me: () => http.get<Admin>("/auth/me"),
};
