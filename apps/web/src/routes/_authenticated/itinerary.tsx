import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Image as ImageIcon,
  ListChecks,
  PawPrint,
} from "lucide-react";
import { useSelector } from "@tanstack/react-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import pawStickerSm from "@/assets/paw-sticker-sm.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  petCardTitleClass,
  petPillOutlineClass,
  petPillPrimaryClass,
} from "@/components/pet/pet-profile-card";
import {
  allowanceStatusLabels,
  getRuleForMode,
  transportModeLabels,
  type TransportRule,
} from "@/data/transport-rules";
import { NearbyPetServices } from "@/components/trip/nearby-pet-services";
import { DayRoutePanel } from "@/components/trip/day-route-panel";
import { PackingChecklistDialog } from "@/components/trip/packing-checklist-dialog";
import { petPolicyFields } from "@/lib/attraction-pet-rules";
import { companionActions } from "@/lib/companion/store";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import {
  downloadBlob,
  elementToPngBlob,
  imageFileName,
} from "@/lib/trip/export-image";
import { TripSectionNav } from "@/components/trip/trip-section-nav";
import { PageFrame } from "@/components/layout/page-frame";
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
import { isTripEnded } from "@/lib/trip/status";
import { tripActions, tripStore } from "@/lib/trip/store";
import { cn } from "@/lib/utils";
import { destinationsQueryOptions } from "@/queries/destinations";
import {
  locationBrowseDetailQueryOptions,
  type PetPolicies,
} from "@/queries/locations";
import { packingChecklistQueryOptions } from "@/queries/packing-checklist";
import { petsQueryOptions } from "@/queries/pets";
import { routeEstimateQueryOptions } from "@/queries/trips";

export const Route = createFileRoute("/_authenticated/itinerary")({
  component: ItineraryPage,
});

const pillLinkClass = (primary: boolean) =>
  cn(
    primary ? petPillPrimaryClass : petPillOutlineClass,
    "inline-flex items-center justify-center",
  );

const cardClass =
  "relative w-full rounded-[26px] bg-card p-6 shadow-pet-card ring-1 ring-foreground/5 sm:p-8";

function ItineraryPage() {
  const active = useActiveTrip();
  const hydration = useHydrationStatus();
  const city = useTripCity();
  const locations = useSelector(tripStore, (state) => state.cache.locations);
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const packingQuery = useQuery({
    ...packingChecklistQueryOptions(active?.id ?? 0, {
      enabled: Boolean(active),
    }),
    throwOnError: false,
  });
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
  const imageSheetRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [imageExportError, setImageExportError] = useState<string | null>(null);

  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  function exportPdf() {
    setPrinting(true);
    companionActions.say("打印窗口我打开啦，选「另存为 PDF」就能带走", "ok");
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
    // 查看行程单即结束编辑态：返回「我的行程」不再显示「编辑中」，需从卡片重新编辑。
    if (active?.planCompleted) {
      tripActions.setEditing(false);
    }
  }, [active?.id, active?.planCompleted]);

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
  const tripEnded = active ? isTripEnded(active) : false;

  useCompanionHint(
    hydration === "idle" || hydration === "loading"
      ? null
      : !active
        ? "先创建行程并生成行程单，我会在这里按天汇总给你看"
        : !active.planCompleted
          ? "行程单还没生成，回地点浏览点「创建行程单」吧"
          : tripEnded
            ? `${active.name}已经结束了，我陪你只读看看，还能导出分享`
            : "我按天把交通食宿应急都列好了，可以导出分享",
    Route.fullPath,
  );

  const selectedDayEntryCount =
    itinerary?.days.find((entry) => entry.day === selectedDay)?.entries.length ??
    null;
  const dayReportedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active?.planCompleted || selectedDayEntryCount === null) return;
    if (dayReportedRef.current === null) {
      dayReportedRef.current = selectedDay;
      return;
    }
    if (dayReportedRef.current === selectedDay) return;
    dayReportedRef.current = selectedDay;
    if (selectedDayEntryCount === 0) {
      companionActions.say(
        `第 ${selectedDay} 天还空着，去地点浏览给我补几个地方吧`,
        "info",
      );
    }
  }, [active?.planCompleted, selectedDay, selectedDayEntryCount]);

  if (!active || !itinerary) {
    if (hydration === "idle" || hydration === "loading") {
      return (
        <PageFrame
          above={<TripSectionNav active="itinerary" />}
          className="border-2 border-paw-accent-soft print:border-0"
        >
          <div
            className="h-[420px] animate-pulse rounded-[26px] bg-muted/60"
            aria-busy="true"
          >
            <span className="sr-only">正在读取行程…</span>
          </div>
        </PageFrame>
      );
    }
    return (
      <PageFrame
        above={<TripSectionNav active="itinerary" />}
        className="border-2 border-paw-accent-soft print:border-0"
      >
        <section className="flex flex-col items-center gap-3 rounded-[26px] bg-muted/40 p-8 text-center">
          <PawPrint
            aria-hidden="true"
            className="size-10 text-muted-foreground/40"
          />
          <h2 className="text-lg font-medium leading-[21.6px]">
            还没有可查看的行程单
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            先创建或打开一个行程，行程单会按天汇总地点、交通与提醒。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/cities" className={pillLinkClass(true)}>
              去创建行程
            </Link>
            <Link to="/trips" className={pillLinkClass(false)}>
              查看我的行程
            </Link>
          </div>
        </section>
      </PageFrame>
    );
  }

  if (!active.planCompleted) {
    return (
      <PageFrame
        above={<TripSectionNav active="itinerary" />}
        className="border-2 border-paw-accent-soft print:border-0"
      >
        <section className="flex flex-col items-center gap-3 rounded-[26px] bg-muted/40 p-8 text-center">
          <PawPrint
            aria-hidden="true"
            className="size-10 text-muted-foreground/40"
          />
          <h2 className="text-lg font-medium leading-[21.6px]">
            尚未创建行程单
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            先在计划中选好景点与交通，点击「创建行程单」后再查看。
          </p>
          <Link to="/attractions" className={pillLinkClass(true)}>
            继续规划
          </Link>
        </section>
      </PageFrame>
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
  const trip = active;
  const ended = tripEnded;
  const packingProgressText = packingQuery.isError
    ? "进度暂不可用"
    : packingQuery.data
      ? `已打包 ${packingQuery.data.progress.checked} / ${packingQuery.data.progress.total} 件`
      : packingQuery.isLoading
        ? "读取中…"
        : "未生成";

  async function exportImages() {
    setImageExportError(null);
    setExportingImage(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      const sheet = imageSheetRef.current;
      if (!sheet) {
        throw new Error("导出容器未就绪");
      }
      const blob = await elementToPngBlob(sheet);
      downloadBlob(blob, imageFileName(trip.name));
      companionActions.say("行程单图片我导出好啦，可以分享给同行伙伴", "ok");
    } catch {
      setImageExportError("图片导出失败，请重试");
      companionActions.say("图片没导出成功，再试一次吧", "danger");
    } finally {
      setExportingImage(false);
    }
  }

  return (
    <PageFrame
      above={<TripSectionNav active="itinerary" />}
      width="wide"
      className="border-2 border-paw-accent-soft print:border-0"
    >

<header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className={petCardTitleClass}>行程单</h1>
          <p className="text-base font-medium text-foreground">{active.name}</p>
          <p className="text-sm text-muted-foreground">
            {cityName} · {meta}
          </p>
          {ended ? (
            <p role="status" className="text-sm text-amber-600">
              该行程
              {endDate ? `已于 ${formatTripDate(endDate) ?? endDate} ` : "已"}
              结束，仅可查看与导出，无法继续编辑。
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3 print:hidden">
          <Button
            type="button"
            variant="outline"
            className={petPillOutlineClass}
            onClick={exportPdf}
            disabled={exportingImage}
          >
            <Download aria-hidden="true" />
            导出 PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className={petPillOutlineClass}
            onClick={() => void exportImages()}
            disabled={exportingImage}
            aria-busy={exportingImage}
          >
            <ImageIcon aria-hidden="true" />
            {exportingImage ? "导出中…" : "导出图片"}
          </Button>
        </div>
      </header>

      {transportRule ? <TransportRuleCard rule={transportRule} /> : null}

      {imageExportError ? (
        <p role="alert" className="text-sm text-destructive">
          {imageExportError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Tabs
          value={String(day.day)}
          onValueChange={(value) => {
            const next = Number(value);
            if (Number.isInteger(next)) setSelectedDay(next);
          }}
        >
          <TabsList
            aria-label="按天切换"
            className="h-auto w-fit max-w-full flex-wrap gap-1 rounded-full bg-muted p-1 group-data-horizontal/tabs:h-auto"
          >
            {itinerary.days.map((entry) => (
              <TabsTrigger
                key={entry.day}
                value={String(entry.day)}
                className="h-9 flex-none rounded-full px-4 text-sm font-medium data-active:bg-foreground data-active:text-background"
              >
                Day {entry.day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={petPillOutlineClass}
            onClick={() => setPackingDialogOpen(true)}
          >
            <ListChecks aria-hidden="true" />
            携带清单
          </Button>
          <span
            data-testid="packing-progress"
            className="text-xs text-muted-foreground"
          >
            {packingProgressText}
          </span>
        </div>
      </div>

      <PackingChecklistDialog
        open={packingDialogOpen}
        onOpenChange={setPackingDialogOpen}
        tripId={active.id}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {(printing ? itinerary.days : [day]).map((entry) => (
          <div key={entry.day} className="min-w-0 lg:col-start-1">
            <DayDetail day={entry} tripId={active.id} forceOpen={printing} />
          </div>
        ))}

        <DayRoutePanel
          day={day}
          locations={locations}
          className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start"
        />

        {itinerary.unscheduledNames.length > 0 ? (
          <section
            aria-label="未排期地点"
            className={cn(
              cardClass,
              "print:shadow-none print:ring-0 lg:col-start-1",
            )}
          >
            <h2 className="text-lg font-medium text-paw-ink">未排期</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {itinerary.unscheduledNames.map((name, index) => (
                <span
                  key={`${index}-${name}`}
                  className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {exportingImage ? (
        <div
          aria-hidden="true"
          style={{ position: "fixed", left: "-20000px", top: 0 }}
        >
          <div
            ref={imageSheetRef}
            data-testid="image-export-surface"
            className="flex flex-col gap-8 bg-white p-10 text-foreground"
            style={{ width: 1080 }}
          >
            <header className="border-b pb-4">
              <p className="text-sm text-muted-foreground">PawTrip · 行程单</p>
              <p className="text-2xl font-semibold">{active.name}</p>
              <p className="text-sm text-muted-foreground">
                {cityName} · {meta}
              </p>
            </header>
            {transportRule ? (
              <TransportRuleCard rule={transportRule} printOnly={false} />
            ) : null}
            {itinerary.days.map((entry) => (
              <section key={entry.day} className="flex flex-col gap-4">
                <DayDetail day={entry} tripId={active.id} forceOpen />
              </section>
            ))}
            {itinerary.unscheduledNames.length > 0 ? (
              <section aria-label="未排期地点" className="flex flex-col gap-2">
                <h2 className="text-lg font-medium text-paw-ink">未排期</h2>
                <div className="flex flex-wrap gap-2">
                  {itinerary.unscheduledNames.map((name, index) => (
                    <span
                      key={`${index}-${name}`}
                      className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageFrame>
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
    <section aria-label="按天行程" className={cn(cardClass, "print:shadow-none")}>
      <img
        src={pawStickerSm}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-5 w-[38px] select-none print:hidden"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2 pr-12">
        <p className="text-lg font-medium leading-snug text-paw-ink">
          {day.dateLabel ?? `第 ${day.day} 天`} · {day.city}
        </p>
        <p className="text-xs text-muted-foreground">{stopCount} 个地点</p>
      </div>

      <div className="mt-4">
        {day.entries.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            当天暂无安排
          </p>
        ) : (
          <ol className="flex flex-col">
            {day.entries.map((entry, index) => (
              <li key={entry.key} className="flex gap-3">
                <div className="flex flex-col items-center pt-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      entry.kind === "stop"
                        ? "bg-paw-accent"
                        : "border border-paw-accent/40 bg-card",
                    )}
                  />
                  {index < day.entries.length - 1 ? (
                    <span aria-hidden="true" className="w-px flex-1 bg-border" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pb-3">
                  {entry.kind === "stop" ? (
                    <div
                      data-testid="itinerary-stop"
                      className="rounded-2xl bg-muted/40 p-4 print:break-inside-avoid"
                    >
                      <p className="text-base font-medium text-paw-ink">
                        {entry.name}
                      </p>
                      {entry.address ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {entry.address}
                        </p>
                      ) : null}
                      <details open={forceOpen} className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground select-none">
                          详细携宠政策
                        </summary>
                        <PolicyList policy={entry.policy} />
                      </details>
                      <NearbyPetServices
                        poiId={entry.poiId}
                        attractionName={entry.name}
                      />
                    </div>
                  ) : (
                    <TransportEntry entry={entry} tripId={tripId} />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {day.policyLines.length > 0 ? (
        <div
          data-testid="itinerary-policy"
          className="mt-3 rounded-2xl bg-paw-accent-soft/70 px-4 py-3 text-xs text-muted-foreground print:break-inside-avoid"
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

function TransportRuleCard({
  rule,
  printOnly = true,
}: {
  rule: TransportRule;
  printOnly?: boolean;
}) {
  return (
    <section
      aria-label="大交通携宠规则"
      className={cn(
        "flex-col gap-1 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground",
        printOnly ? "hidden print:flex print:break-inside-avoid" : "flex",
      )}
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
      className="flex flex-col gap-1 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground print:break-inside-avoid"
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
