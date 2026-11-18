import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPanel } from "../components/trip/trip-panel";
import { AgentPanel } from "../components/agent/agent-panel";
import { hydrateTripContext, retryTripHydration } from "../lib/trip/hydrate";
import { readPersistedActiveTripId } from "../lib/trip/persistence";
import { scheduleTripSave } from "../lib/trip/save";
import {
  useActiveTrip,
  useHydrationStatus,
  useSaveRevision,
} from "../lib/trip/selectors";
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

  return <AuthenticatedShell />;
}

function AuthenticatedShell() {
  const queryClient = useQueryClient();
  const activeId = useActiveTrip()?.id ?? null;
  const revision = useSaveRevision();
  const hydration = useHydrationStatus();
  const [hasPersistedTrip, setHasPersistedTrip] = useState(false);

  useEffect(() => {
    void hydrateTripContext(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (activeId != null && revision > 0) {
      scheduleTripSave();
    }
  }, [activeId, revision]);

  useEffect(() => {
    setHasPersistedTrip(readPersistedActiveTripId() != null);
  }, [hydration]);

  return (
    <>
      {/* 页头 .paw-header 固定 80px；外壳再撑满 100svh 会让页面多出 80px 空白滚动 */}
      <div className="min-h-[calc(100svh-80px)] [view-transition-name:app-content]">
        <Outlet />
      </div>
      <TripPanel />
      <AgentPanel />
      {hydration === "idle" && hasPersistedTrip ? (
        <div
          role="alert"
          className="fixed top-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg"
        >
          恢复激活行程失败
          <Button size="sm" variant="outline" onClick={() => void retryTripHydration(queryClient)}>
            重试
          </Button>
        </div>
      ) : null}
    </>
  );
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
