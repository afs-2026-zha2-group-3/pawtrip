import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { destinationsQueryOptions } from "@/queries/destinations";
import { petsQueryOptions } from "@/queries/pets";
import {
  deleteTrip,
  fetchTripDetail,
  tripQueryKeys,
  tripsQueryOptions,
  type TripSummary,
} from "@/queries/trips";
import { useActiveTrip, useDraftTrip } from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

function TripsPage() {
  const queryClient = useQueryClient();
  const trips = useQuery(tripsQueryOptions());
  const destinations = useQuery(destinationsQueryOptions({}));
  const pets = useQuery(petsQueryOptions());
  const active = useActiveTrip();
  const draft = useDraftTrip();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const cityNames = new Map(
    (destinations.data ?? []).map((city) => [city.adcode, city.name]),
  );
  const petNames = new Map((pets.data ?? []).map((pet) => [pet.id, pet.name]));

  const activate = async (trip: TripSummary) => {
    if (draft) {
      setError("存在未确认草稿，请先在行程面板放弃草稿后再激活。");
      return;
    }
    if (active) {
      setError("已有激活行程，请先取消激活再激活其他行程。");
      return;
    }
    setError(null);
    setBusyId(trip.id);
    try {
      const detail = await fetchTripDetail(trip.id);
      tripActions.setActive(detail);
      const city = destinations.data?.find((candidate) => candidate.adcode === trip.cityAdcode);
      if (city) {
        tripActions.cacheCity({
          adcode: city.adcode,
          name: city.name,
          province: city.province,
        });
      }
    } catch {
      setError("激活行程失败，请稍后重试。");
    } finally {
      setBusyId(null);
    }
  };

  const deactivate = () => {
    tripActions.clearActive();
    setError(null);
  };

  const remove = async (trip: TripSummary) => {
    setError(null);
    setBusyId(trip.id);
    const wasActive = active?.id === trip.id;
    if (wasActive) {
      tripActions.clearActive();
    }
    try {
      await deleteTrip(trip.id);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
    } catch {
      if (wasActive && active) {
        tripActions.setActive(active);
      }
      setError("删除行程失败，请稍后重试。");
    } finally {
      setBusyId(null);
    }
  };

  if (trips.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载行程…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const items = [...(trips.data ?? [])].sort((a, b) => a.id - b.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium">我的行程</h1>
        {active ? (
          <Button variant="outline" size="sm" disabled title="已有激活行程">
            创建新行程
          </Button>
        ) : draft ? (
          <Button variant="outline" size="sm" disabled title="存在未确认草稿">
            创建新行程
          </Button>
        ) : (
          <Link to="/cities" className={buttonVariants({ size: "sm" })}>
            创建新行程
          </Link>
        )}
      </div>

      {draft ? (
        <Alert>
          <AlertTitle>存在未确认草稿</AlertTitle>
          <AlertDescription>
            草稿仅保存在行程面板中，请先放弃草稿后才能激活其他行程。
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>还没有行程</EmptyTitle>
            <EmptyDescription>先从城市浏览选定城市创建一个行程。</EmptyDescription>
          </EmptyHeader>
          <Link to="/cities" className={buttonVariants({ size: "sm" })}>
            去创建行程
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((trip) => {
            const isActive = active?.id === trip.id;
            return (
              <Card key={trip.id} data-testid="trip-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {trip.name}
                    {isActive ? <Badge>激活中</Badge> : null}
                  </CardTitle>
                  <CardDescription>
                    {cityNames.get(trip.cityAdcode) ?? trip.cityAdcode} · {trip.totalDays} 天 ·{" "}
                    {petNames.get(trip.petId) ?? `宠物 #${trip.petId}`}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="gap-2">
                  {isActive ? (
                    <Button size="sm" variant="outline" onClick={deactivate}>
                      取消激活
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={Boolean(active) || Boolean(draft) || busyId === trip.id}
                      onClick={() => void activate(trip)}
                    >
                      激活
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button size="sm" variant="ghost" disabled={busyId === trip.id} />}
                    >
                      删除
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>删除「{trip.name}」？</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isActive
                            ? "该行程当前处于激活状态，删除前会先取消激活。此操作不可撤销。"
                            : "此操作不可撤销。"}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => void remove(trip)}
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {active ? (
        <p className="text-sm text-muted-foreground">
          当前激活：{active.name}。取消激活后可创建或激活其他行程。
        </p>
      ) : null}
    </main>
  );
}
