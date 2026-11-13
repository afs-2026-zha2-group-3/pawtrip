import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">PawTrip</p>
        <p className="m-0 text-base leading-8 text-[var(--sea-ink-soft)]">Checking your session…</p>
      </section>
    </main>
  );
}
