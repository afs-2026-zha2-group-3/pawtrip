import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "../../../queries/auth";

export const Route = createFileRoute("/_authenticated/admin/cities")({
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") return;

    let user;
    try {
      user = await context.queryClient.fetchQuery(authQueryOptions);
    } catch {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminCitiesPage,
});

function AdminCitiesPage() {
  const navigate = useNavigate();
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });

  // beforeLoad 在 SSR 水合时不重跑，直接访问需组件级守卫兜底（同 admin/locations 模式）
  useEffect(() => {
    if (auth.data && auth.data.role !== "ADMIN") {
      void navigate({ to: "/", replace: true });
    } else if (auth.isError) {
      void navigate({ to: "/login", replace: true });
    }
  }, [auth.data, auth.isError, navigate]);

  return null;
}
