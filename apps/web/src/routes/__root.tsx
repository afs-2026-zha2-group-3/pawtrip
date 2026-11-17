import { useState, type ReactNode } from "react";
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "../lib/http/api-error";
import { tripActions } from "../lib/trip/store";
import { authQueryOptions, logout } from "../queries/auth";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "PawTrip",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      tripActions.clearTripContext();
      void navigate({ to: "/login", replace: true });
    },
  });

  return (
    <header className="relative flex items-center justify-center px-4 pt-9 pb-4">
      <AppTabs />
      {auth.isSuccess ? (
        <AlertDialog
          open={logoutDialogOpen}
          onOpenChange={setLogoutDialogOpen}
        >
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={
                  pathname === "/paws"
                    ? "absolute right-4 rounded-full bg-card/90 shadow-sm backdrop-blur-sm"
                    : "absolute right-4"
                }
                disabled={logoutMutation.isPending}
              />
            }
          >
            {logoutMutation.isPending ? "Signing out…" : "Log out"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again to access PawTrip.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setLogoutDialogOpen(false);
                  logoutMutation.mutate();
                }}
              >
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {logoutMutation.isError ? (
        <p
          className="absolute right-4 top-full text-xs font-medium text-destructive"
          role="alert"
        >
          Logout failed
        </p>
      ) : null}
    </header>
  );
}

const navPillClass =
  "h-auto flex-none rounded-full px-5 py-2.5 text-base text-foreground group-data-horizontal/tabs:h-auto hover:bg-muted data-active:bg-foreground data-active:text-background group-data-[variant=default]/tabs-list:data-active:shadow-[0_3px_1px_0_rgba(0,0,0,0.04),0_3px_8px_0_rgba(0,0,0,0.12)] dark:text-foreground/70 dark:data-active:border-transparent dark:data-active:bg-foreground dark:data-active:text-background";

function AppTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });
  const isAttractions = pathname === "/attractions" || pathname.startsWith("/attractions/");
  const activeTab = isAttractions
    ? "attractions"
    : pathname === "/paws"
      ? "paws"
      : pathname === "/cities"
        ? "cities"
        : pathname === "/transport-rules"
          ? "transport-rules"
          : pathname === "/trips" || pathname === "/itinerary"
            ? "trips"
            : pathname === "/admin/locations"
              ? "locations"
              : pathname === "/admin/cities"
                ? "admin-cities"
                : "home";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (value === "paws") {
          void navigate({ to: "/paws" });
        } else if (value === "cities") {
          void navigate({ to: "/cities" });
        } else if (value === "attractions") {
          void navigate({ to: "/attractions" });
        } else if (value === "transport-rules") {
          void navigate({ to: "/transport-rules" });
        } else if (value === "trips") {
          void navigate({ to: "/trips" });
        } else if (value === "locations") {
          void navigate({ to: "/admin/locations" });
        } else if (value === "admin-cities") {
          void navigate({ to: "/admin/cities" });
        } else {
          void navigate({ to: "/" });
        }
      }}
    >
      <TabsList
        aria-label="主导航"
        className="group-data-horizontal/tabs:h-auto gap-1 rounded-full bg-card p-1.5 shadow-md"
      >
        <TabsTrigger value="home" className={navPillClass}>首页</TabsTrigger>
        <TabsTrigger value="paws" className={navPillClass}>我的宠物</TabsTrigger>
        <TabsTrigger value="cities" className={navPillClass}>城市浏览</TabsTrigger>
        <TabsTrigger value="attractions" className={navPillClass}>地点浏览</TabsTrigger>
        <TabsTrigger value="transport-rules" className={navPillClass}>交通规则</TabsTrigger>
        <TabsTrigger value="trips" className={navPillClass}>我的行程</TabsTrigger>
        {auth.data?.role === "ADMIN" ? (
          <>
            <TabsTrigger value="locations" className={navPillClass}>地点管理</TabsTrigger>
            <TabsTrigger value="admin-cities" className={navPillClass}>城市管理</TabsTrigger>
          </>
        ) : null}
      </TabsList>
    </Tabs>
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const queryClient = useQueryClient();
  const message = error instanceof ApiError ? error.detail : "Something went wrong.";

  const handleRetry = async () => {
    await queryClient.resetQueries();
    reset();
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Unable to load this page</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleRetry}>Try again</Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function NotFoundComponent() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The page you requested does not exist.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/" className={buttonVariants()}>
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className={
          pathname === "/paws"
            ? "bg-pet-pattern min-h-svh text-foreground antialiased"
            : pathname === "/cities" || pathname === "/transport-rules"
              ? "bg-pet-pattern-dense min-h-svh text-foreground antialiased"
              : "min-h-svh bg-background text-foreground antialiased"
        }
      >
        {pathname === "/login" ? null : <AppHeader />}
        {children}
        <Scripts />
      </body>
    </html>
  );
}
