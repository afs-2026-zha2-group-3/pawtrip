import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "../lib/http/api-error";
import { authQueryOptions, login } from "../queries/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useQuery({
    ...authQueryOptions,
    enabled: typeof window !== "undefined",
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (auth.isSuccess) {
      void navigate({ to: "/", replace: true });
    }
  }, [auth.isSuccess, navigate]);

  const mutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(authQueryOptions.queryKey, user);
      void navigate({ to: "/", replace: true });
    },
  });

  const errorMessage = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.status === 401
      ? "Invalid username or password."
      : "Unable to sign in. Please try again."
    : null;

  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your PawTrip account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {errorMessage ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
