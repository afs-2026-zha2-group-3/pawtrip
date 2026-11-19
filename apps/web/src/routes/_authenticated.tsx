import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash });
  const scrollRef = useRef<HTMLDivElement>(null);

  // 客户端注水完成的确定性信号：SSR 会先渲染 header，e2e 不能只靠可见性判断可交互。
  useEffect(() => {
    document.documentElement.dataset.appReady = "true";
    return () => {
      delete document.documentElement.dataset.appReady;
    };
  }, []);

  useEffect(() => {
    if (hash) {
      return;
    }
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname, hash]);

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
      <div
        ref={scrollRef}
        data-testid="app-scroll"
        className="app-scroll min-h-0 flex-1 overflow-y-auto pt-[var(--app-header-height)] [view-transition-name:app-content] print:pt-0"
      >
        <Outlet />
      </div>
      <AgentPanel />
      {hydration === "idle" && hasPersistedTrip ? (
        <div
          role="alert"
          className="fixed top-[calc(var(--app-header-height)+0.5rem)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg"
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
