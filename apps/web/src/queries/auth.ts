import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type CurrentUser = { username: string; role: "USER" | "ADMIN" };

export const authQueryOptions = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: ({ signal }) => request<CurrentUser>("/api/auth/me", { signal }),
  retry: false,
  staleTime: 0,
  throwOnError: false,
});

export function login(username: string, password: string) {
  return request<CurrentUser>("/api/auth/login", {
    method: "POST",
    body: new URLSearchParams({ username, password }),
  });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}
