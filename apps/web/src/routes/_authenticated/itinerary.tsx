import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useSelector } from "@tanstack/react-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  allowanceStatusLabels,
  getRuleForMode,
  transportModeLabels,
  type TransportRule,
} from "@/data/transport-rules";
import { petPolicyFields } from "@/lib/attraction-pet-rules";
import { TripSectionNav } from "@/components/trip/trip-section-nav";
import {
  addDays,
  buildItinerary,
  formatTripDate,
  type ItineraryDayLine,
  type ItineraryEntry,
} from "@/lib/trip/itinerary";
import {
  ESTIMATE_LOADING_TEXT,
  ESTIMATE_UNAVAILABLE_TEXT,
  SAME_POI_NOTE,
  TAXI_PET_HINT,
} from "@/lib/trip/transport-segments";
import {
  useActiveTrip,
  useHydrationStatus,
  useTripCity,
} from "@/lib/trip/selectors";
import { tripActions, tripStore } from "@/lib/trip/store";
import { cn } from "@/lib/utils";
import { destinationsQueryOptions } from "@/queries/destinations";
import {
  locationBrowseDetailQueryOptions,
  type PetPolicies,
} from "@/queries/locations";
import { petsQueryOptions } from "@/queries/pets";
import { routeEstimateQueryOptions } from "@/queries/trips";

export const Route = createFileRoute("/_authenticated/itinerary")({
  component: ItineraryPage,
});

function ItineraryPage() {
  const active = useActiveTrip();
  const hydration = useHydrationStatus();
  const city = useTripCity();
  const locations = useSelector(tripStore, (state) => state.cache.locations);
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const cityMatchesActive = Boolean(
    city && active && city.adcode === active.cityAdcode,
  );
  const destinationsQuery = useQuery({
    ...destinationsQueryOptions({}),
    throwOnError: false,
    enabled: Boolean(active) && !cityMatchesActive,
  });
  const queryClient = useQueryClient();
  const requested = useRef(new Set<string>());
  const [selectedDay, setSelectedDay] = useState(1);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  function exportPdf() {
    setPrinting(true);
    // 等打印态（渲染全部 Day）提交后再打开打印对话框。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  const pet = active
    ? (petsQuery.data ?? []).find((candidate) => candidate.id === active.petId) ??
      null
    : null;

  const missingKey = useMemo(() => {
    if (!active) return "";
    const ids = new Set<string>();
    for (const day of active.plan.days) {
      for (const stop of day.stops) ids.add(stop.poiId);
    }
    for (const stop of active.plan.unscheduled) ids.add(stop.poiId);
    return [...ids].filter((poiId) => !locations[poiId]).join(",");
  }, [active, locations]);

  useEffect(() => {
    requested.current.clear();
  }, [active?.id]);

  useEffect(() => {
    if (!missingKey) return;
    for (const poiId of missingKey.split(",")) {
      if (requested.current.has(poiId)) continue;
      requested.current.add(poiId);
      queryClient
        .fetchQuery(locationBrowseDetailQueryOptions(poiId))
        .then((detail) => tripActions.cacheLocation(detail))
        .catch(() => {
          requested.current.delete(poiId);
        });
    }
  }, [missingKey, queryClient]);

  const cityName =
    city && active && city.adcode === active.cityAdcode
      ? city.name
      : ((destinationsQuery.data ?? []).find(
          (candidate) => candidate.adcode === active?.cityAdcode,
        )?.name ??
        active?.cityAdcode ??
        "城市");
  const itinerary = useMemo(
    () => (active ? buildItinerary(active, cityName, locations, pet) : null),
    [active, cityName, locations, pet],
  );

  if (!active || !itinerary) {
    if (hydration === "idle" || hydration === "loading") {
      return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
          <TripSectionNav active="itinerary" />
          <p role="status" className="text-sm text-muted-foreground">
            正在读取行程…
          </p>
        </main>
      );
    }
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <TripSectionNav active="itinerary" />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>还没有可查看的行程单</EmptyTitle>
            <EmptyDescription>
              先创建并激活一个行程，行程单会按天汇总地点、交通与提醒。
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex gap-2">
            <Link to="/cities" className={buttonVariants({ size: "sm" })}>
              去创建行程
            </Link>
            <Link
              to="/trips"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              查看我的行程
            </Link>
          </div>
        </Empty>
      </main>
    );
  }

  const day =
    itinerary.days.find((entry) => entry.day === selectedDay) ??
    itinerary.days[0];
  const endDate = active.startDate
    ? addDays(active.startDate, active.totalDays - 1)
    : null;
  const dateRange =
    active.startDate && endDate
      ? `${formatTripDate(active.startDate) ?? active.startDate} 至 ${
          formatTripDate(endDate) ?? endDate
        }`
      : `${active.totalDays} 天`;
  const meta = [
    pet?.name ?? `宠物 #${active.petId}`,
    dateRange,
    active.transportMode
      ? `大交通 ${transportModeLabels[active.transportMode]}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const transportRule = active.transportMode
    ? getRuleForMode(active.transportMode)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 print:max-w-none print:p-0">
      <TripSectionNav active="itinerary" />

      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">PawTrip</p>
        <h1 className="text-2xl font-semibold tracking-tight">行程单</h1>
        <p className="text-base font-medium">{active.name}</p>
        <p className="text-sm text-muted-foreground">
          {cityName} · {meta}
        </p>
      </header>

      {transportRule ? <TransportRuleCard rule={transportRule} /> : null}

      <div className="flex justify-end print:hidden">
        <Button type="button" size="sm" variant="outline" onClick={exportPdf}>
          <Download aria-hidden="true" />
          导出 PDF
        </Button>
      </div>

      <div className="print:hidden">
        <Tabs
          value={String(day.day)}
          onValueChange={(value) => {
            const next = Number(value);
            if (Number.isInteger(next)) setSelectedDay(next);
          }}
        >
          <TabsList aria-label="按天切换">
            {itinerary.days.map((entry) => (
              <TabsTrigger key={entry.day} value={String(entry.day)}>
                Day {entry.day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {(printing ? itinerary.days : [day]).map((entry) => (
        <DayDetail
          key={entry.day}
          day={entry}
          tripId={active.id}
          forceOpen={printing}
        />
      ))}

      {itinerary.unscheduledNames.length > 0 ? (
        <section aria-label="未排期地点" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">未排期</h2>
          <div className="flex flex-wrap gap-1.5">
            {itinerary.unscheduledNames.map((name, index) => (
              <span
                key={`${index}-${name}`}
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DayDetail({
  day,
  tripId,
  forceOpen,
}: {
  day: ItineraryDayLine;
  tripId: number;
  forceOpen: boolean;
}) {
  const stopCount = day.entries.filter((entry) => entry.kind === "stop").length;
  return (
    <section aria-label="按天行程" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-medium">
          {day.dateLabel ?? `第 ${day.day} 天`} · {day.city}
        </p>
        <p className="text-xs text-muted-foreground">{stopCount} 个地点</p>
      </div>

      {day.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">当天暂无安排</p>
      ) : (
        <ol className="flex flex-col">
          {day.entries.map((entry, index) => (
            <li key={entry.key} className="flex gap-3">
              <div className="flex flex-col items-center pt-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    entry.kind === "stop"
                      ? "bg-primary"
                      : "border border-border bg-background",
                  )}
                />
                {index < day.entries.length - 1 ? (
                  <span aria-hidden="true" className="w-px flex-1 bg-border" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                {entry.kind === "stop" ? (
                  <Card data-testid="itinerary-stop" className="print:break-inside-avoid">
                    <CardHeader>
                      <CardTitle className="text-base">{entry.name}</CardTitle>
                      {entry.address ? (
                        <CardDescription>{entry.address}</CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <details open={forceOpen}>
                        <summary className="cursor-pointer text-sm text-muted-foreground select-none">
                          详细携宠政策
                        </summary>
                        <PolicyList policy={entry.policy} />
                      </details>
                    </CardContent>
                  </Card>
                ) : (
                  <TransportEntry entry={entry} tripId={tripId} />
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {day.policyLines.length > 0 ? (
        <div
          data-testid="itinerary-policy"
          className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
        >
          <p className="mb-1 font-medium text-foreground">当天提醒</p>
          <ul className="flex flex-col gap-0.5">
            {day.policyLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function TransportRuleCard({ rule }: { rule: TransportRule }) {
  return (
    <section
      aria-label="大交通携宠规则"
      className="hidden flex-col gap-1 rounded-md border px-3 py-2 text-xs text-muted-foreground print:flex print:break-inside-avoid"
    >
      <p className="text-sm font-medium text-foreground">
        大交通携宠规则 · {transportModeLabels[rule.mode]}
        {rule.carrierName ? `（${rule.carrierName}）` : ""}
      </p>
      <p>
        {allowanceStatusLabels[rule.allowanceStatus]} · {rule.allowedSummary}
      </p>
      {rule.allowanceNote ? <p>{rule.allowanceNote}</p> : null}
      <p>
        {rule.weightLimitKg === null
          ? `体重限制：${rule.weightLimitNote}`
          : `体重上限：≤${rule.weightLimitKg} kg（${rule.weightLimitNote}）`}
      </p>
      {rule.shoulderLimitCm === null ? null : (
        <p>肩高上限：≤{rule.shoulderLimitCm} cm</p>
      )}
      <p>容器要求：{rule.containerRequirement}</p>
      <p>办理流程：{rule.procedureSummary}</p>
      <p>检疫证明：{rule.extra.quarantineRequirement ?? "—"}</p>
      {rule.mode === "flight" ? (
        <p>飞机规则因航司与航线而异；此处按代表航司展示，出行前请核对实际承运方。</p>
      ) : null}
      <p className="mt-1">
        来源：{rule.sourceTitle}
        {rule.verifiedOn ? ` · 已复核 ${rule.verifiedOn}` : ""}
        ；以承运方最新规则为准。
      </p>
    </section>
  );
}

function TransportEntry({
  entry,
  tripId,
}: {
  entry: Extract<ItineraryEntry, { kind: "transport" }>;
  tripId: number;
}) {
  const samePoi = entry.fromPoiId === entry.toPoiId;
  const queryMode = entry.displayMode === "walk" ? "walk" : "drive";
  const estimateQuery = useQuery(
    routeEstimateQueryOptions(tripId, entry.fromPoiId, entry.toPoiId, queryMode, {
      enabled: !samePoi && !entry.estimate,
    }),
  );
  const estimate = entry.estimate ?? estimateQuery.data ?? null;

  return (
    <div
      data-testid="itinerary-transport"
      className="flex flex-col gap-1 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">
          途内交通 · {entry.label}
        </span>
        {samePoi ? (
          <span>{SAME_POI_NOTE}</span>
        ) : estimate ? (
          <>
            <span>约 {estimate.durationMinutes} 分钟</span>
            {entry.displayMode === "drive" ? (
              <span>
                ¥{estimate.costLowYuan}–{estimate.costHighYuan}
              </span>
            ) : entry.displayMode === "walk" ? (
              <span>¥0</span>
            ) : null}
          </>
        ) : estimateQuery.isError ? (
          <span>{ESTIMATE_UNAVAILABLE_TEXT}</span>
        ) : (
          <span>{ESTIMATE_LOADING_TEXT}</span>
        )}
      </div>
      {!samePoi && entry.displayMode === "drive" ? (
        <p>{TAXI_PET_HINT}</p>
      ) : null}
    </div>
  );
}

function PolicyList({ policy }: { policy: PetPolicies | null }) {
  const fields = policy ? petPolicyFields(policy) : [];
  if (fields.length === 0) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">暂无详细规则</p>
    );
  }
  return (
    <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="text-right">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
