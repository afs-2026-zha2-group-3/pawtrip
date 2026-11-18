import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PawPrint, Plus, Trash2 } from "lucide-react";
import pawStickerLg from "@/assets/paw-sticker-lg.png";
import pawStickerSm from "@/assets/paw-sticker-sm.png";
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
import { Button } from "@/components/ui/button";
import {
  petCardTitleClass,
  petLabelClass,
  petPillOutlineClass,
  petPillPrimaryClass,
  petRowClass,
  petValueClass,
} from "@/components/pet/pet-profile-card";
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
import { TripSectionNav } from "@/components/trip/trip-section-nav";
import { cn } from "@/lib/utils";
import { runViewTransition } from "@/lib/view-transition";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

const pillLinkClass = (primary: boolean) =>
  cn(
    primary ? petPillPrimaryClass : petPillOutlineClass,
    "inline-flex items-center justify-center",
  );

function formatTripDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

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
      const city = destinations.data?.find((candidate) => candidate.adcode === trip.cityAdcode);
      runViewTransition(() => {
        tripActions.setActive(detail);
        if (city) {
          tripActions.cacheCity({
            adcode: city.adcode,
            name: city.name,
            province: city.province,
          });
        }
      });
    } catch {
      setError("激活行程失败，请稍后重试。");
    } finally {
      setBusyId(null);
    }
  };

  const deactivate = () => {
    runViewTransition(() => tripActions.clearActive());
    setError(null);
  };

  const remove = async (trip: TripSummary) => {
    setError(null);
    setBusyId(trip.id);
    const wasActive = active?.id === trip.id;
    if (wasActive) {
      runViewTransition(() => tripActions.clearActive());
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
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 print:max-w-none print:p-0">
        <TripSectionNav active="trips" />
        <div
          className="h-[420px] animate-pulse rounded-[26px] bg-card/80"
          aria-busy="true"
        >
          <span className="sr-only">正在加载行程…</span>
        </div>
      </main>
    );
  }

  const items = [...(trips.data ?? [])].sort((a, b) => a.id - b.id);

  const createAction =
    active || draft ? (
      <Button
        variant="outline"
        className={pillLinkClass(false)}
        disabled
        title={active ? "已有激活行程" : "存在未确认草稿"}
      >
        <Plus aria-hidden="true" />
        创建新行程
      </Button>
    ) : (
      <Link to="/cities" className={pillLinkClass(false)}>
        <Plus aria-hidden="true" />
        创建新行程
      </Link>
    );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 print:max-w-none print:p-0">
      <TripSectionNav active="trips" />
      {items.length > 0 ? (
        <div className="flex justify-end">{createAction}</div>
      ) : null}
      <div className="flex flex-col gap-6">
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
          <section className="flex flex-col items-center gap-3 rounded-[26px] bg-muted/40 p-8 text-center">
            <PawPrint aria-hidden="true" className="size-10 text-muted-foreground/40" />
            <h2 className="text-lg font-medium leading-[21.6px]">还没有行程</h2>
            <p className="text-sm text-muted-foreground">
              先从城市浏览选定城市创建一个行程。
            </p>
            <Link to="/cities" className={pillLinkClass(true)}>
              去创建行程
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((trip) => {
              const isActive = active?.id === trip.id;
              return (
                <section
                  key={trip.id}
                  id={`trip-${trip.id}`}
                  data-testid="trip-card"
                  className="relative w-full rounded-[26px] bg-card p-6 shadow-pet-card ring-1 ring-foreground/5"
                >
                  <img
                    src={pawStickerLg}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-6 top-5 w-[72px] select-none"
                  />
                  <img
                    src={pawStickerSm}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-[84px] w-[38px] select-none"
                  />
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-2 pr-24">
                      <h2 className={petCardTitleClass}>{trip.name}</h2>
                      {isActive ? <Badge>激活中</Badge> : null}
                    </div>

                    <div className="flex flex-col gap-4">
                      <TripRow
                        label="城市"
                        value={cityNames.get(trip.cityAdcode) ?? trip.cityAdcode}
                      />
                      <TripRow label="天数" value={`${trip.totalDays} 天`} />
                      <TripRow
                        label="宠物"
                        value={petNames.get(trip.petId) ?? `宠物 #${trip.petId}`}
                      />
                      <TripRow
                        label="出发日期"
                        value={trip.startDate ? formatTripDate(trip.startDate) : "未设置"}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              aria-label={`删除 ${trip.name}`}
                              className="size-9 rounded-full border-border bg-card hover:bg-muted [&_svg:not([class*='size-'])]:size-4"
                              disabled={busyId === trip.id}
                            />
                          }
                        >
                          <Trash2 aria-hidden="true" />
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
                      {isActive ? (
                        <>
                          <Button
                            variant="outline"
                            className={petPillOutlineClass}
                            onClick={deactivate}
                          >
                            取消激活
                          </Button>
                          <Link to="/itinerary" className={pillLinkClass(false)}>
                            行程单
                          </Link>
                        </>
                      ) : (
                        <Button
                          className={petPillPrimaryClass}
                          disabled={Boolean(active) || Boolean(draft) || busyId === trip.id}
                          onClick={() => void activate(trip)}
                        >
                          激活
                        </Button>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {active ? (
          <p className="text-sm text-muted-foreground">
            当前激活：{active.name}。取消激活后可创建或激活其他行程。
          </p>
        ) : null}
      </div>
    </main>
  );
}

function TripRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={petRowClass}>
      <span className={petLabelClass}>{label}</span>
      <span className={petValueClass}>{value}</span>
    </div>
  );
}
