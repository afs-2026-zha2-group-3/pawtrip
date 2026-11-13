import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authQueryOptions } from "../queries/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });

  useEffect(() => {
    if (auth.isError) {
      void navigate({ to: "/login", replace: true });
    }
  }, [auth.isError, navigate]);

  if (!isClient || auth.isPending || auth.isError || !auth.data) {
    return <AuthLoading />;
  }

  return <Outlet />;
}

function AuthLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>PawTrip</CardTitle>
          <CardDescription>Checking your session…</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
