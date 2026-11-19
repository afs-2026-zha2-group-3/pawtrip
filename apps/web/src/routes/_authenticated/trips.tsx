import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { companionActions } from "@/lib/companion/store";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import {
  useActiveTrip,
  useDraftTrip,
  useSaveStatus,
  useTripEditing,
} from "@/lib/trip/selectors";
import { formatTripDate } from "@/lib/trip/itinerary";
import {
  TRIP_STATUS_LABELS,
  isEditingTrip,
  tripEndDate,
  tripStatus,
  tripStatusOrder,
  type TripStatus,
} from "@/lib/trip/status";
import { tripActions } from "@/lib/trip/store";
import { TripSectionNav } from "@/components/trip/trip-section-nav";
import { PageFrame } from "@/components/layout/page-frame";
import { runViewTransition } from "@/lib/view-transition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

const STATUS_BADGE_VARIANTS: Record<
  TripStatus,
  "default" | "secondary" | "outline"
> = {
  pending: "outline",
  completed: "default",
  ended: "secondary",
};

type TripFilter = "all" | TripStatus;

const FILTERS: { key: TripFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待完成" },
  { key: "completed", label: "已完成" },
  { key: "ended", label: "行程结束" },
];

function TripsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const trips = useQuery(tripsQueryOptions());
  const destinations = useQuery(destinationsQueryOptions({}));
  const pets = useQuery(petsQueryOptions());
  const active = useActiveTrip();
  const editingSession = useTripEditing();
  const draft = useDraftTrip();
  const save = useSaveStatus();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TripFilter>("all");

  const cityNames = new Map(
    (destinations.data ?? []).map((city) => [city.adcode, city.name]),
  );
  const petNames = new Map((pets.data ?? []).map((pet) => [pet.id, pet.name]));

  const openTrip = async (trip: TripSummary, target: "plan" | "itinerary") => {
    if (draft) {
      setError("存在未确认草稿，请先在行程面板放弃草稿后再切换行程。");
      companionActions.say("我发现还有没确认的草稿，先放弃它再切换行程吧", "warn");
      return;
    }
    if (tripStatus(trip) === "ended" && !trip.planCompleted) {
      setError("该行程已结束，且没有行程单可查看。");
      companionActions.say("这份行程已经结束了，我也找不到可查看的行程单", "warn");
      return;
    }
    if (active && active.id !== trip.id && save.status === "error") {
      setError("当前行程有未保存的修改，请先重试保存再切换。");
      companionActions.say("当前行程还有修改没保存成功，先帮我重试保存再切换吧", "danger");
      return;
    }
    setError(null);
    const to = target === "plan" ? "/attractions" : "/itinerary";
    if (active?.id === trip.id) {
      if (target === "plan") {
        tripActions.setEditing(true);
      }
      companionActions.say(
        tripStatus(trip) === "ended"
          ? `${trip.name}已经结束了，我们只能看看行程单`
          : `继续编辑「${trip.name}」吧，我还没玩够`,
        tripStatus(trip) === "ended" ? "info" : "ok",
      );
      await navigate({ to });
      return;
    }
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
      companionActions.say(
        tripStatus(trip) === "ended"
          ? `「${trip.name}」的行程单打开啦，不过行程已经结束`
          : `切换到「${trip.name}」啦，我们接着安排吧`,
        tripStatus(trip) === "ended" ? "info" : "ok",
      );
      await navigate({ to });
    } catch {
      setError("打开行程失败，请稍后重试。");
      companionActions.say("行程没打开，再试一次吧", "danger");
    } finally {
      setBusyId(null);
    }
  };

  const endEditing = () => {
    runViewTransition(() => tripActions.clearActive());
    setError(null);
    companionActions.say("我先收起编辑啦，点一张卡片就能继续安排", "info");
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

  useCompanionHint(
    trips.isPending
      ? null
      : (trips.data ?? []).length === 0
        ? "创建第一份行程吧，我们从城市浏览挑个目的地开始"
        : active
          ? `我正在陪你编辑「${active.name}」，点其他卡片可以切换`
          : "点卡片切换行程，或者创建一份新的",
    Route.fullPath,
  );

  if (trips.isPending) {
    return (
      <PageFrame
        above={<TripSectionNav active="trips" />}
        className="border-2 border-paw-accent-soft print:border-0"
      >
        <Card>
          <CardHeader>
            <CardTitle>正在加载行程…</CardTitle>
          </CardHeader>
        </Card>
      </PageFrame>
    );
  }

  const sorted = [...(trips.data ?? [])].sort((a, b) => {
    const order =
      tripStatusOrder(tripStatus(a)) - tripStatusOrder(tripStatus(b));
    return order !== 0 ? order : a.id - b.id;
  });
  const items =
    filter === "all"
      ? sorted
      : sorted.filter((trip) => tripStatus(trip) === filter);

  return (
    <PageFrame
      above={<TripSectionNav active="trips" />}
      className="border-2 border-paw-accent-soft print:border-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium">我的行程</h1>
        {draft ? (
          <Button variant="outline" size="sm" disabled title="存在未确认草稿">
            创建新行程
          </Button>
        ) : (
          <Link to="/cities" className={buttonVariants({ size: "sm" })}>
            创建新行程
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="行程状态筛选">
        {FILTERS.map((entry) => (
          <Button
            key={entry.key}
            size="sm"
            variant={filter === entry.key ? "default" : "outline"}
            aria-pressed={filter === entry.key}
            onClick={() => setFilter(entry.key)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {draft ? (
        <Alert>
          <AlertTitle>存在未确认草稿</AlertTitle>
          <AlertDescription>
            草稿仅保存在行程面板中，请先放弃草稿后才能切换行程。
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
            <EmptyTitle>
              {sorted.length === 0 ? "还没有行程" : "该状态下没有行程"}
            </EmptyTitle>
            <EmptyDescription>
              {sorted.length === 0
                ? "先从城市浏览选定城市创建一个行程。"
                : "切换筛选查看其他状态的行程。"}
            </EmptyDescription>
          </EmptyHeader>
          {sorted.length === 0 ? (
            <Link to="/cities" className={buttonVariants({ size: "sm" })}>
              去创建行程
            </Link>
          ) : null}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((trip) => {
            const status = tripStatus(trip);
            const editing = isEditingTrip(
              trip,
              editingSession ? (active?.id ?? null) : null,
            );
            const endDate = tripEndDate(trip);
            const canOpen = status !== "ended" || trip.planCompleted;
            const summary = `${cityNames.get(trip.cityAdcode) ?? trip.cityAdcode} · ${trip.totalDays} 天 · ${petNames.get(trip.petId) ?? `宠物 #${trip.petId}`}`;
            const showsSummary =
              summary.replace(/\s/g, "") !== trip.name.replace(/\s/g, "");
            const openCard = () => {
              if (busyId === trip.id) return;
              void openTrip(trip, status === "pending" ? "plan" : "itinerary");
            };
            const handleClick = (event: MouseEvent<HTMLElement>) => {
              if ((event.target as HTMLElement).closest("button, a")) return;
              openCard();
            };
            const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              openCard();
            };
            return (
              <Card
                key={trip.id}
                data-testid="trip-card"
                role={canOpen ? "button" : undefined}
                tabIndex={canOpen ? 0 : undefined}
                aria-label={canOpen ? `${trip.name}（${TRIP_STATUS_LABELS[status]}）` : undefined}
                onClick={canOpen ? handleClick : undefined}
                onKeyDown={canOpen ? handleKeyDown : undefined}
                className={cn(
                  "transition-colors",
                  canOpen &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  status === "ended" && "opacity-75",
                  busyId === trip.id && "pointer-events-none opacity-60",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {trip.name}
                    <Badge variant={STATUS_BADGE_VARIANTS[status]}>
                      {TRIP_STATUS_LABELS[status]}
                    </Badge>
                    {editing ? <Badge variant="outline">编辑中</Badge> : null}
                  </CardTitle>
                  {showsSummary ? (
                    <CardDescription>{summary}</CardDescription>
                  ) : null}
                  {status === "completed" ? (
                    <CardDescription className="text-xs">
                      {endDate
                        ? `行程单已创建 · 可调整至 ${formatTripDate(endDate)}`
                        : "行程单已创建 · 可继续调整安排"}
                    </CardDescription>
                  ) : null}
                  {status === "ended" && endDate ? (
                    <CardDescription className="text-xs">
                      {`${formatTripDate(endDate)} 已结束，仅可查看`}
                      {trip.planCompleted ? "" : " · 未创建行程单"}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardFooter className="mt-auto gap-2">
                  {status === "ended" ? (
                    trip.planCompleted ? (
                      <Button size="sm" variant="outline" onClick={() => openCard()}>
                        查看行程单
                      </Button>
                    ) : null
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={status === "completed" ? "outline" : "default"}
                        disabled={busyId === trip.id}
                        onClick={() => void openTrip(trip, "plan")}
                      >
                        {active?.id === trip.id && editingSession ? "继续编辑" : "编辑"}
                      </Button>
                      {trip.planCompleted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === trip.id}
                          onClick={() => void openTrip(trip, "itinerary")}
                        >
                          查看行程单
                        </Button>
                      ) : null}
                    </>
                  )}
                  {active?.id === trip.id && (editingSession || status === "ended") ? (
                    <Button size="sm" variant="ghost" onClick={endEditing}>
                      {status === "ended" ? "退出查看" : "结束编辑"}
                    </Button>
                  ) : null}
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
                          {editing
                            ? "该行程当前处于编辑中，删除前会先结束编辑。此操作不可撤销。"
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

      <p className="text-sm text-muted-foreground">
        {active ? (
          tripStatus(active) === "ended" ? (
            `当前查看：${active.name}（行程结束），仅可查看和导出。点其他行程可直接切换。`
          ) : !editingSession && tripStatus(active) === "completed" ? (
            `当前查看：${active.name}（已完成）。点「编辑」可继续调整安排，点其他行程可直接切换。`
          ) : tripStatus(active) === "completed" ? (
            `当前编辑：${active.name}（已完成）。行程单已创建，结束前仍可调整安排。点其他行程可直接切换。`
          ) : (
            `当前编辑：${active.name}（待完成）。选好景点与交通后点击「创建行程单」完成规划。点其他行程可直接切换。`
          )
        ) : (
          "当前没有编辑中的行程。点击卡片开始规划，已完成或结束的行程可查看行程单。"
        )}
      </p>
    </PageFrame>
  );
}
