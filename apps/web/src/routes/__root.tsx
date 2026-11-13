import type { ReactNode } from "react";
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
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      void navigate({ to: "/login", replace: true });
    },
  });

  return (
    <header className="relative flex items-center justify-center px-4 py-4">
      <AppTabs />
      {auth.isSuccess ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-4"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Signing out…" : "Log out"}
        </Button>
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

function AppTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const activeTab = pathname === "/paws" ? "paws" : "home";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        navigate({ to: value === "paws" ? "/paws" : "/" })
      }
    >
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="paws">Paws</TabsTrigger>
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <AppHeader />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
