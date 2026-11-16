import { createFileRoute, redirect } from "@tanstack/react-router";
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
  return null;
}
