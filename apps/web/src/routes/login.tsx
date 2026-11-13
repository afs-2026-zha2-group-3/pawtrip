import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/http/api-error";
import { authQueryOptions, login } from "../queries/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useQuery({ ...authQueryOptions, enabled: typeof window !== "undefined" });
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
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell mx-auto w-full max-w-md rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="island-kicker mb-3">PawTrip</p>
        <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)]">Sign in</h1>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="block text-sm font-semibold text-[var(--sea-ink)]">
            Username
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-base text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--sea-ink)]">
            Password
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-base text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {errorMessage ? (
            <p className="m-0 text-sm font-semibold text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--sea-ink)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
