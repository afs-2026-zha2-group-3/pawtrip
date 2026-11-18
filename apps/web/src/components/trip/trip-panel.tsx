import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatedList, type AnimatedListItem } from "@/components/ui/animated-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationBrowseDetailQueryOptions } from "@/queries/locations";
import { petsQueryOptions } from "@/queries/pets";
import { createTrip, tripQueryKeys } from "@/queries/trips";
import { createEmptyPlan, stopKey, type StopContainer } from "@/lib/trip/plan";
import {
  TRANSIT_PET_NOTICE,
  buildDaySegments,
  showTransitNotice,
  type TransportSegment,
} from "@/lib/trip/transport-segments";
import { TransportSegmentRow } from "@/components/trip/transport-segment";
import { TransportModePicker } from "@/components/trip/transport-mode-picker";
import { dayPolicyLines, deriveDayPolicy, sizeWarningLine } from "@/lib/trip/day-policy";
import { retryTripSave } from "@/lib/trip/save";
import {
  useActiveTrip,
  useDraftTrip,
  usePanelExpanded,
  useSaveStatus,
  useTripCity,
} from "@/lib/trip/selectors";
import { tripActions, tripStore } from "@/lib/trip/store";
import { MAX_TRIP_DAYS, MIN_TRIP_DAYS } from "@/lib/trip/types";
import { runViewTransition } from "@/lib/view-transition";
import { cn } from "@/lib/utils";

interface HeaderRow {
  kind: "header";
  id: string;
  container: StopContainer;
  title: string;
  endIndex: number;
  count: number;
}

interface StopRow {
  kind: "stop";
  id: string;
  container: StopContainer;
  index: number;
  poiId: string;
  name: string;
  /** 体型超限警示：展示在该景点行下方（2026-11-17 修订） */
  sizeWarning: string | null;
}

interface SegmentRow {
  kind: "segment";
  id: string;
  container: number;
  index: number;
  segment: TransportSegment;
}

interface NoticeRow {
  kind: "notice";
  id: string;
  container: number;
}

interface PolicyRow {
  kind: "policy";
  id: string;
  container: number;
  lines: string[];
}

type PanelRow = HeaderRow | StopRow | SegmentRow | NoticeRow | PolicyRow;

const TAG_CLASS =
  "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground";
const ACTION_BUTTON_CLASS =
  "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground";

export function TripPanel({
  embedded = false,
  timeline = false,
  footer,
}: {
  embedded?: boolean;
  timeline?: boolean;
  footer?: ReactNode;
}) {
  const active = useActiveTrip();
  const draft = useDraftTrip();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onAttractions = pathname === "/attractions" || pathname.startsWith("/attractions/");
  // 地点浏览页把面板嵌进左侧行程栏（embedded），其余页面保持悬浮面板。
  if (onAttractions !== embedded) {
    return null;
  }
  if (!active && !draft) {
    return null;
  }
  return <TripPanelContent embedded={embedded} timeline={timeline} footer={footer} />;
}

function TripPanelContent({
  embedded,
  timeline,
  footer,
}: {
  embedded: boolean;
  timeline: boolean;
  footer?: ReactNode;
}) {
  const active = useActiveTrip();
  const draft = useDraftTrip();
  const expanded = usePanelExpanded();
  const [listOpen, setListOpen] = useState(true);
  const open = embedded ? listOpen : expanded;
  const city = useTripCity();
  const save = useSaveStatus();
  const locations = useSelector(tripStore, (state) => state.cache.locations);
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const queryClient = useQueryClient();
  const [draftError, setDraftError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const requested = useRef(new Set<string>());

  const activePet = active
    ? (petsQuery.data ?? []).find((pet) => pet.id === active.petId) ?? null
    : null;

  const rows = useMemo<PanelRow[]>(() => {
    if (!active) return [];
    const next: PanelRow[] = [];
    for (let day = 1; day <= active.totalDays; day += 1) {
      const stops = active.plan.days.find((entry) => entry.day === day)?.stops ?? [];
      next.push({
        kind: "header",
        id: `day-${day}`,
        container: day,
        title: timeline ? `Day ${day}` : `第 ${day} 天`,
        endIndex: stops.length,
        count: stops.length,
      });
      if (!timeline && showTransitNotice(stops, active.transportMode)) {
        next.push({ kind: "notice", id: `transit-notice-${day}`, container: day });
      }
      const dayPolicy = deriveDayPolicy(stops, locations, activePet);
      const policyLines = dayPolicyLines(dayPolicy);
      if (!timeline && policyLines.length > 0) {
        next.push({ kind: "policy", id: `day-policy-${day}`, container: day, lines: policyLines });
      }
      const warningByPoi = new Map(
        dayPolicy.sizeWarnings.map((warning) => [
          warning.poiId,
          sizeWarningLine(warning, activePet?.name ?? null),
        ]),
      );
      const segments = buildDaySegments(stops, active.transportMode);
      stops.forEach((stop, index) => {
        next.push({
          kind: "stop",
          id: stopKey(day, index, stop.poiId),
          container: day,
          index,
          poiId: stop.poiId,
          name: locations[stop.poiId]?.name ?? stop.poiId,
          sizeWarning: warningByPoi.get(stop.poiId) ?? null,
        });
        const segment = segments[index];
        if (segment) {
          next.push({
            kind: "segment",
            id: `seg-${stopKey(day, index, stop.poiId)}`,
            container: day,
            index,
            segment,
          });
        }
      });
    }
    next.push({
      kind: "header",
      id: "unscheduled",
      container: "unscheduled",
      title: timeline ? "待安排" : "未排期",
      endIndex: active.plan.unscheduled.length,
      count: active.plan.unscheduled.length,
    });
    active.plan.unscheduled.forEach((stop, index) => {
      next.push({
        kind: "stop",
        id: stopKey("unscheduled", index, stop.poiId),
        container: "unscheduled",
        index,
        poiId: stop.poiId,
        name: locations[stop.poiId]?.name ?? stop.poiId,
        sizeWarning: null,
      });
    });
    return next;
  }, [active, locations, activePet]);

  const missingPoiIds = useMemo(() => {
    const ids = new Set<string>();
    if (!active) return [] as string[];
    for (const day of active.plan.days) {
      for (const stop of day.stops) ids.add(stop.poiId);
    }
    for (const stop of active.plan.unscheduled) ids.add(stop.poiId);
    return [...ids].filter((poiId) => !locations[poiId]);
  }, [active, locations]);

  const missingKey = missingPoiIds.join(",");
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const contextAdcode = active?.cityAdcode ?? draft?.cityAdcode;
  const cityName =
    city && city.adcode === contextAdcode ? city.name : (contextAdcode ?? "城市");
  const stopRows = rows.filter((row): row is StopRow => row.kind === "stop");
  const dragged = stopRows.find((row) => row.id === dragId) ?? null;
  const animatedItems: AnimatedListItem[] = rows.map((row) => ({
    id: row.id,
    title:
      row.kind === "header"
        ? row.title
        : row.kind === "stop"
          ? row.name
          : row.kind === "notice"
            ? TRANSIT_PET_NOTICE
            : row.kind === "policy"
              ? row.lines.join("；")
              : "途内交通",
    selectable: row.kind === "stop",
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragId(null);
    const source = stopRows.find((row) => row.id === String(event.active.id));
    const target = rows.find((row) => row.id === String(event.over?.id));
    if (!source || !target) return;
    if (target.kind === "notice" || target.kind === "segment" || target.kind === "policy") return;
    const to =
      target.kind === "header"
        ? { container: target.container, index: target.endIndex }
        : { container: target.container, index: target.index };
    if (source.container === to.container && source.index === to.index) {
      return;
    }
    tripActions.moveStop({ container: source.container, index: source.index }, to);
  };

  const removeStop = (row: StopRow) => {
    tripActions.removeStop({ container: row.container, index: row.index });
  };

  const updateDays = (value: string) => {
    setDraftError(null);
    if (!/^\d+$/.test(value.trim())) {
      setDraftError("旅游总天数需为 1–7 的整数。");
      return;
    }
    const days = Number(value);
    if (days < MIN_TRIP_DAYS || days > MAX_TRIP_DAYS) {
      setDraftError("旅游总天数需为 1–7 的整数。");
      return;
    }
    tripActions.updateDraft({ totalDays: days });
  };

  const stepDays = (delta: number) => {
    if (!draft) return;
    const current = draft.totalDays ?? MIN_TRIP_DAYS;
    const next = Math.min(MAX_TRIP_DAYS, Math.max(MIN_TRIP_DAYS, current + delta));
    setDraftError(null);
    tripActions.updateDraft({ totalDays: next });
  };

  const confirmDraft = async () => {
    if (!draft || !draft.totalDays || !draft.petId) {
      setDraftError("请选择 1–7 天并选择一只宠物后再确认。");
      return;
    }
    setConfirming(true);
    setDraftError(null);
    try {
      const pet = (petsQuery.data ?? []).find((candidate) => candidate.id === draft.petId);
      const trip = await createTrip({
        name: `${cityName} · ${draft.totalDays}天 · ${pet?.name ?? draft.petId}`,
        cityAdcode: draft.cityAdcode,
        petId: draft.petId,
        totalDays: draft.totalDays,
        plan: createEmptyPlan(draft.totalDays),
      });
      tripActions.setActive(trip);
      tripActions.discardDraft();
      tripActions.setSaveStatus("saved");
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
    } catch {
      setDraftError("创建行程失败，请重试。");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <aside
      data-testid="trip-panel"
      aria-label="行程面板"
      className={cn(
        "flex min-w-0 flex-col gap-2 text-card-foreground",
        timeline
          ? "h-full w-full overflow-hidden border-r border-[#E5E5E5] pr-3"
          : embedded
            ? "w-full rounded-xl border bg-card p-3"
            : "z-50 rounded-xl border bg-card shadow-xl [view-transition-name:trip-panel]",
        !embedded &&
          (open
            ? "fixed inset-0 overflow-y-auto p-4 lg:top-24 lg:bottom-4 lg:left-4 lg:right-auto lg:w-[364px] lg:rounded-xl"
            : "fixed bottom-4 left-4 w-[min(92vw,360px)] rounded-xl p-3"),
      )}
      data-print-hidden
    >
      <div className="flex items-start justify-between gap-2">
        {timeline ? (
          <div className="flex min-w-0 items-center">
            <h2 className="text-sm leading-5 font-medium text-paw-ink">每日景点行程</h2>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {active ? (
              <>
                <span className={TAG_CLASS}>{cityName}</span>
                <span className={TAG_CLASS}>{active.totalDays} 天</span>
                <span className={TAG_CLASS}>{activePet?.name ?? `宠物 #${active.petId}`}</span>
                <TransportModePicker
                  value={active.transportMode}
                  pet={activePet}
                  petState={
                    petsQuery.isPending
                      ? "loading"
                      : petsQuery.isError
                        ? "error"
                        : "ready"
                  }
                  onChange={(mode) => tripActions.setTransportMode(mode)}
                />
                <span className={TAG_CLASS} data-testid="save-status" data-status={save.status}>
                  {save.status === "saving"
                    ? "保存中…"
                    : save.status === "saved"
                      ? "已保存"
                      : save.status === "error"
                        ? "保存失败"
                        : "已同步"}
                </span>
                <Link
                  to="/itinerary"
                  data-testid="itinerary-link"
                  className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  行程单
                </Link>
              </>
            ) : draft ? (
              <>
                <span className={TAG_CLASS}>{cityName}</span>
                <span className="text-xs text-muted-foreground">未确认草稿</span>
              </>
            ) : null}
          </div>
        )}
        {!timeline ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={open ? "收起行程面板" : "展开行程面板"}
            data-testid="trip-panel-toggle"
            onClick={() => {
              if (embedded) {
                setListOpen(!open);
                return;
              }
              runViewTransition(() => tripActions.setPanelExpanded(!open));
            }}
          >
            {open ? "收起" : "展开"}
          </Button>
        ) : null}
      </div>

      {draft ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">天数</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="减少行程天数"
              onClick={() => stepDays(-1)}
            >
              −
            </Button>
            <Input
              aria-label="行程天数"
              className="h-8 w-16 text-center"
              inputMode="numeric"
              value={draft.totalDays ?? ""}
              onChange={(event) => updateDays(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="增加行程天数"
              onClick={() => stepDays(1)}
            >
              +
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">宠物</span>
            {petsQuery.data && petsQuery.data.length > 0 ? (
              <Select
                value={draft.petId == null ? "" : String(draft.petId)}
                onValueChange={(value) => {
                  if (value) tripActions.updateDraft({ petId: Number(value) });
                }}
              >
                <SelectTrigger size="sm" aria-label="选择携带宠物" className="flex-1">
                  <SelectValue>
                    {(value: string | null) =>
                      (petsQuery.data ?? []).find((pet) => String(pet.id) === value)?.name ??
                      "选择宠物"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(petsQuery.data ?? []).map((pet) => (
                      <SelectItem key={pet.id} value={String(pet.id)}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <Link to="/paws" className="text-xs text-primary underline underline-offset-2">
                请先在 Paws 添加宠物
              </Link>
            )}
          </div>
          {draftError ? (
            <p className="text-xs text-destructive" role="alert">
              {draftError}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="trip-panel-confirm"
              disabled={confirming || draft.totalDays == null || draft.petId == null}
              onClick={() => void confirmDraft()}
            >
              {confirming ? "创建中…" : "确认行程"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="trip-panel-discard"
              onClick={() => {
                setDraftError(null);
                runViewTransition(() => tripActions.discardDraft());
              }}
            >
              放弃草稿
            </Button>
          </div>
        </div>
      ) : null}

      {active ? (
        <>
          {(!embedded || open) && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={
              embedded
                ? {
                    // 嵌入页面流时文档级自动滚动会移动面板导致落点偏移，只允许列表内容器滚动。
                    canScroll: (element) =>
                      element instanceof HTMLElement &&
                      element !== document.body &&
                      element !== document.documentElement &&
                      element !== document.scrollingElement,
                  }
                : undefined
            }
          >
            <SortableContext
              items={stopRows.map((row) => row.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatedList
                items={animatedItems}
                selectOnHover={false}
                enableArrowNavigation={false}
                animation={embedded ? "none" : "fade"}
                theme="light"
                frame={false}
                displayScrollbar={false}
                width="100%"
                gap={timeline ? 12 : 6}
                radius={8}
                maxHeight={
                  open
                    ? timeline
                      ? footer
                        ? "calc(100svh - 280px)"
                        : "calc(100svh - 170px)"
                      : embedded
                        ? 320
                        : "calc(100vh - 18rem)"
                    : 220
                }
                className={cn("w-full", timeline && "[&>[role=listbox]]:p-0")}
                itemClassName={
                  timeline
                    ? "!cursor-grab !rounded-none !bg-transparent ![background:none] !p-0 !shadow-none"
                    : ""
                }
                itemRim={!timeline}
                renderItem={(item) => {
                  const row = rows.find((candidate) => candidate.id === String((item as { id?: string }).id));
                  if (!row) return null;
                  if (row.kind === "header") {
                    return <DroppableHeader row={row} timeline={timeline} />;
                  }
                  if (row.kind === "notice") {
                    return (
                      <p
                        data-testid="transit-pet-notice"
                        className="px-1 text-xs text-muted-foreground"
                      >
                        {TRANSIT_PET_NOTICE}
                      </p>
                    );
                  }
                  if (row.kind === "policy") {
                    return (
                      <div data-testid="day-policy-reminder" className="flex flex-col gap-0.5 px-1">
                        {row.lines.map((line) => (
                          <p key={line} className="text-xs text-amber-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  if (row.kind === "segment") {
                    return (
                      <TransportSegmentRow
                        tripId={active!.id}
                        stopRef={{ container: row.container, index: row.index }}
                        segment={row.segment}
                        transportMode={active!.transportMode}
                        compact={timeline}
                      />
                    );
                  }
                  // 行容器为横向 flex：纵向包裹使警示独占景点下方一行
                  return (
                    <div className="flex w-full min-w-0 flex-col gap-1">
                      <SortableStop
                        row={row}
                        timeline={timeline}
                        onRemove={() => removeStop(row)}
                      />
                      {row.sizeWarning ? (
                        <p
                          data-testid="stop-size-warning"
                          className="px-1 text-xs text-amber-600"
                        >
                          {row.sizeWarning}
                        </p>
                      ) : null}
                    </div>
                  );
                }}
              />
            </SortableContext>
            <DragOverlay>
              {dragged ? (
                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
                  {dragged.name}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          )}
          {save.status === "error" ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-2 py-1.5">
              <span className="text-xs text-destructive">{save.message ?? "保存失败"}</span>
              <Button type="button" size="sm" variant="outline" onClick={retryTripSave}>
                重试
              </Button>
            </div>
          ) : null}
          {timeline && footer ? (
            <div className="mt-auto flex shrink-0 flex-col gap-2">{footer}</div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}

function DroppableHeader({ row, timeline }: { row: HeaderRow; timeline: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: row.id,
    data: { kind: "header", container: row.container },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        timeline
          ? "inline-flex h-7 w-fit items-center justify-between gap-2 rounded-full bg-[#F5F5F5] px-2.5 text-xs font-normal text-foreground"
          : "flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-xs font-semibold text-muted-foreground",
        isOver && "bg-primary/10 text-primary",
      )}
    >
      <span>{row.title}</span>
      {timeline ? null : <span className="tabular-nums">{row.count}</span>}
    </div>
  );
}

function SortableStop({
  row,
  timeline,
  onRemove,
}: {
  row: StopRow;
  timeline: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.id,
      data: {
        kind: "stop",
        container: row.container,
        index: row.index,
        poiId: row.poiId,
      },
    });
  return (
    <div
      ref={setNodeRef}
      data-stop-id={row.id}
      {...(timeline ? attributes : {})}
      {...(timeline ? listeners : {})}
      className={cn(
        timeline
          ? "relative ml-7 flex h-11 w-[calc(100%-1.75rem)] touch-none items-center gap-2 rounded-xl border border-[#E5E5E5] bg-card px-3 text-sm font-medium text-paw-ink after:absolute after:top-1/2 after:left-[-23px] after:z-10 after:size-2.5 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-paw-accent after:bg-card"
          : "flex w-full items-center gap-2 rounded-md px-1 py-0.5",
        isDragging && "opacity-40",
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX}, ${transform.scaleY})`
          : undefined,
        transition: transition ?? undefined,
      }}
    >
      {!timeline ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`拖动${row.name}`}
          className={cn(ACTION_BUTTON_CLASS, "cursor-grab touch-none")}
          onClick={(event) => event.stopPropagation()}
        >
          ⠿
        </button>
      ) : null}
      <span className="relative z-10 min-w-0 flex-1 truncate text-sm">{row.name}</span>
      <button
        type="button"
        aria-label={`移除${row.name}`}
        className={cn(ACTION_BUTTON_CLASS, "relative z-10")}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        ×
      </button>
    </div>
  );
}
