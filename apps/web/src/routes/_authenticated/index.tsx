import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { greetingQueryOptions } from "../../queries/greeting";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { data } = useQuery(greetingQueryOptions);
  const message = data?.message ?? "";

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{message}</CardTitle>
        </CardHeader>
      </Card>
    </main>
  );
}
