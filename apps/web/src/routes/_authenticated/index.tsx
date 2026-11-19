import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import { useActiveTrip } from "@/lib/trip/selectors";
import { greetingQueryOptions } from "../../queries/greeting";
import { petsPreviewQueryOptions } from "../../queries/pets";
import { tripsPreviewQueryOptions } from "../../queries/trips";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { data } = useQuery(greetingQueryOptions);
  const pets = useQuery({ ...petsPreviewQueryOptions(), throwOnError: false });
  const trips = useQuery({ ...tripsPreviewQueryOptions(), throwOnError: false });
  const active = useActiveTrip();
  const message = data?.message ?? "";

  const hint =
    pets.isPending || trips.isPending
      ? null
      : (pets.data ?? []).length === 0
        ? "先给我建个档案吧，这样我才能被你记住"
        : (trips.data ?? []).length === 0
          ? "我从城市浏览开始带你挑目的地吧"
          : active
            ? `继续完善「${active.name}」吧，我还想多去几个地方`
            : "去「我的行程」点一张卡片，我们接着上次的旅程";
  useCompanionHint(hint, Route.fullPath);

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
