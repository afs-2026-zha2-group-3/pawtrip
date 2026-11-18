import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PolicySubjectNotice } from "@/components/trip/policy-tags";
import { TripPanel } from "@/components/trip/trip-panel";
import { petRulesApplyTo } from "@/lib/attraction-pet-rules";
import { useAgentOpen } from "@/lib/agent/selectors";
import { cn } from "@/lib/utils";
import { amapJsKey } from "../../../lib/amap/loader";
import { ApiError } from "../../../lib/http/api-error";
import { useScheduledAttractionAnchors } from "../../../lib/trip/anchors";
import { useActiveTrip, usePolicySubjects } from "../../../lib/trip/selectors";
import { cancelScheduledTripSave, flushTripSave } from "../../../lib/trip/save";
import { isTripEnded } from "../../../lib/trip/status";
import { tripActions, tripStore } from "../../../lib/trip/store";
import { completeTrip, tripQueryKeys } from "../../../queries/trips";
import {
  locationTypesQueryOptions,
  locationsQueryOptions,
  mapLocationsQueryOptions,
} from "../../../queries/locations";
import { LocationCard } from "./-location-card";
import { LocationDetailDialog } from "./-location-detail-dialog";
import { LocationMap } from "./-location-map";
import { MapLocationCard } from "./-map-location-card";
import { TripDateCard } from "./-trip-date-card";

export const Route = createFileRoute("/_authenticated/attractions/")({
  component: AttractionsPage,
});

const PAGE_SIZE = 20;
const DEFAULT_TYPE_GROUP = "attraction";
const NEARBY_TYPE_GROUPS = new Set(["hotel", "restaurant"]);

function AttractionsPage() {
  const isClient = typeof window !== "undefined";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const active = useActiveTrip();
  const policySubjects = usePolicySubjects();
  const agentOpen = useAgentOpen();
  const totalDays = active?.totalDays ?? 1;
  const [typeGroup, setTypeGroup] = useState(DEFAULT_TYPE_GROUP);
  const [includeWithoutRules, setIncludeWithoutRules] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [mapFocusPoiId, setMapFocusPoiId] = useState<string | null>(null);
  const [mapDetailPoiId, setMapDetailPoiId] = useState<string | null>(null);
  const [anchorPoiId, setAnchorPoiId] = useState<string | null>(null);
  const [activeKeytag, setActiveKeytag] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const mapEnabled = Boolean(amapJsKey());
  const { anchors, loading: anchorsLoading } = useScheduledAttractionAnchors(active);

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const clientFilterActive = activeKeytag !== null || normalizedKeyword !== "";

  const nearbyType = NEARBY_TYPE_GROUPS.has(typeGroup);
  const petRulesApply = petRulesApplyTo(typeGroup);
  const gated = nearbyType && anchorPoiId === null;
  const nearbyAnchorPoiId = nearbyType ? (anchorPoiId ?? undefined) : undefined;
  const anchorName = anchorPoiId
    ? (anchors.find((anchor) => anchor.poiId === anchorPoiId)?.name ?? null)
    : null;

  const activeTripId = active?.id ?? null;
  const previousTripId = useRef(activeTripId);
  useEffect(() => {
    if (previousTripId.current !== activeTripId) {
      previousTripId.current = activeTripId;
      setTypeGroup(DEFAULT_TYPE_GROUP);
      setAnchorPoiId(null);
      setActiveKeytag(null);
      setSearchInput("");
      setKeyword("");
      setPage(1);
    }
  }, [activeTripId]);

  useEffect(() => {
    if (!anchorPoiId || anchorsLoading) {
      return;
    }
    if (!anchors.some((anchor) => anchor.poiId === anchorPoiId)) {
      setAnchorPoiId(null);
    }
  }, [anchorPoiId, anchors, anchorsLoading]);

  useEffect(() => {
    setMapDetailPoiId(null);
  }, [typeGroup, activeTripId]);

  useEffect(() => {
    setPage(1);
  }, [activeKeytag, normalizedKeyword]);

  const locationTypes = useQuery({
    ...locationTypesQueryOptions(),
    enabled: isClient && active !== null,
    throwOnError: true,
  });
  const regionCode = active?.cityAdcode ?? "";
  const locations = useQuery({
    ...locationsQueryOptions({
      regionCode,
      typeGroup,
      petFriendlyOnly: petRulesApply && !includeWithoutRules,
      nearPoiId: nearbyAnchorPoiId,
      page,
      pageSize: PAGE_SIZE,
    }),
    enabled: isClient && Boolean(regionCode) && !gated,
    throwOnError: (error) =>
      !(Boolean(nearbyAnchorPoiId) && error instanceof ApiError && error.status === 400),
    placeholderData: keepPreviousData,
  });
  const friendlyEmpty =
    petRulesApply &&
    !gated &&
    !locations.isError &&
    !includeWithoutRules &&
    locations.data !== undefined &&
    locations.data.totalElements === 0;
  const allLocations = useQuery({
    ...locationsQueryOptions({
      regionCode,
      typeGroup,
      petFriendlyOnly: false,
      nearPoiId: nearbyAnchorPoiId,
      page: 1,
      pageSize: 1,
    }),
    enabled: isClient && Boolean(regionCode) && !gated && friendlyEmpty,
    throwOnError: false,
  });
  const anchorError = Boolean(
    nearbyAnchorPoiId && locations.error instanceof ApiError && locations.error.status === 400,
  );
  const fullLocations = useQuery({
    ...mapLocationsQueryOptions({
      regionCode,
      typeGroup,
      petFriendlyOnly: petRulesApply && !includeWithoutRules,
      nearPoiId: nearbyAnchorPoiId,
    }),
    enabled: isClient && Boolean(regionCode) && !gated && (mapEnabled || clientFilterActive),
    throwOnError: false,
    placeholderData: keepPreviousData,
  });

  const filteredItems = useMemo(() => {
    if (!clientFilterActive) {
      return [];
    }
    return (fullLocations.data ?? []).filter((item) => {
      if (activeKeytag !== null && item.keytag !== activeKeytag) {
        return false;
      }
      if (normalizedKeyword) {
        const haystack = `${item.name} ${item.address ?? ""} ${item.keytag ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedKeyword)) {
          return false;
        }
      }
      return true;
    });
  }, [clientFilterActive, fullLocations.data, activeKeytag, normalizedKeyword]);

  const chipOptions = useMemo(() => {
    if (typeGroup !== DEFAULT_TYPE_GROUP) {
      return [];
    }
    const source = fullLocations.data ?? locations.data?.items ?? [];
    const counts = new Map<string, number>();
    for (const item of source) {
      if (item.keytag) {
        counts.set(item.keytag, (counts.get(item.keytag) ?? 0) + 1);
      }
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
    if (activeKeytag && !top.includes(activeKeytag)) {
      top.unshift(activeKeytag);
    }
    return top;
  }, [typeGroup, fullLocations.data, locations.data, activeKeytag]);

  if (!isClient) {
    return null;
  }

  if (!active) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>先创建或激活行程</EmptyTitle>
            <EmptyDescription>
              地点浏览以激活行程的城市为准；请先在「城市浏览」创建行程或在「Trips」激活已有行程。
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => void navigate({ to: "/cities" })}>去创建行程</Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/trips" })}>
              查看我的行程
            </Button>
          </div>
        </Empty>
      </main>
    );
  }

  if (!locationTypes.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载地点…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!gated && !locations.data && !locations.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载地点…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const types = locationTypes.data;
  const data = locations.data;
  const selectedType = types.find((option) => option.key === typeGroup);
  const typeLabel = selectedType?.label ?? "地点";
  const nearbyActive = nearbyType && anchorPoiId !== null;
  const checkingAny = friendlyEmpty && allLocations.isPending;
  const anyExists = (allLocations.data?.totalElements ?? 0) > 0;
  const emptyTitle = !petRulesApply
    ? nearbyActive
      ? `该锚点 5km 内暂无已保存${typeLabel}`
      : `该城市暂无已保存${typeLabel}`
    : includeWithoutRules
      ? nearbyActive
        ? `该锚点 5km 内暂无已保存${typeLabel}`
        : `该城市暂无已保存${typeLabel}`
      : checkingAny
        ? `正在确认${nearbyActive ? "该锚点 5km 内" : "该城市"}${typeLabel}…`
        : anyExists
          ? nearbyActive
            ? `该锚点 5km 内暂无宠物友好的已保存${typeLabel}`
            : `该城市暂无宠物友好的已保存${typeLabel}`
          : nearbyActive
            ? `该锚点 5km 内暂无已保存${typeLabel}`
            : `该城市暂无已保存${typeLabel}`;
  const showToggleHint = petRulesApply && !includeWithoutRules && !checkingAny && anyExists;

  const gridItems = clientFilterActive
    ? filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : (data?.items ?? []);
  const gridTotalPages = clientFilterActive
    ? Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
    : (data?.totalPages ?? 1);

  const changeType = (value: string) => {
    setTypeGroup(value);
    setActiveKeytag(null);
    setPage(1);
  };

  const enterNearbyLocations = () => {
    const firstAnchor = anchors[0];
    if (!firstAnchor || anchorsLoading) {
      return;
    }
    setAnchorPoiId(firstAnchor.poiId);
    changeType("hotel");
  };

  const backToAttractions = () => {
    setAnchorPoiId(null);
    changeType(DEFAULT_TYPE_GROUP);
  };

  const createItinerary = async () => {
    if (!active || completing) {
      return;
    }
    setCompleteError(null);
    setCompleting(true);
    try {
      cancelScheduledTripSave();
      await flushTripSave();
      if (tripStore.state.save.status === "error") {
        setCompleteError("行程保存失败，请重试后再创建行程单。");
        return;
      }
      const updated = await completeTrip(active.id);
      tripActions.setActive(updated);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
      await navigate({ to: "/itinerary" });
    } catch {
      setCompleteError("创建行程单失败，请稍后重试。");
    } finally {
      setCompleting(false);
    }
  };

  const activeEnded = active ? isTripEnded(active) : false;

  const panelFooter =
    typeGroup === DEFAULT_TYPE_GROUP ? (
      <>
        <p
          data-testid="trip-next-step-hint"
          className="px-1 text-xs leading-4 text-muted-foreground"
        >
          {anchorsLoading || anchors.length === 0
            ? "先在行程中添加景点，下一步可挑选附近的住宿与餐厅"
            : "下一步将按评分推荐 5km 内的住宿与餐厅"}
        </p>
        <Button
          type="button"
          data-testid="trip-next-step"
          className="w-full"
          disabled={anchorsLoading || anchors.length === 0}
          onClick={enterNearbyLocations}
        >
          下一步
        </Button>
      </>
    ) : active?.planCompleted ? (
      <>
        <p className="px-1 text-xs leading-4 text-muted-foreground">
          行程单已创建，仍可继续调整安排
        </p>
        <Button
          type="button"
          data-testid="trip-create-itinerary"
          className="w-full"
          onClick={() => void navigate({ to: "/itinerary" })}
        >
          查看行程单
        </Button>
      </>
    ) : activeEnded ? (
      <p className="px-1 text-xs leading-4 text-muted-foreground">
        行程已结束，未创建行程单。
      </p>
    ) : (
      <>
        <p className="px-1 text-xs leading-4 text-muted-foreground">
          行程已保存，创建行程单查看每日安排
        </p>
        {completeError ? (
          <p role="alert" className="px-1 text-xs leading-4 text-destructive">
            {completeError}
          </p>
        ) : null}
        <Button
          type="button"
          data-testid="trip-create-itinerary"
          className="w-full"
          disabled={completing}
          onClick={() => void createItinerary()}
        >
          {completing ? "正在创建…" : "创建行程单"}
        </Button>
      </>
    );

  const renderCards = () => (
    <div
      className={cn(
        "paw-grid grid gap-6 sm:grid-cols-2",
        !agentOpen && "2xl:grid-cols-3",
      )}
    >
      {gridItems.map((location) => (
        <LocationCard
          key={location.poiId}
          location={location}
          typeLabel={
            types.find((option) => option.key === location.typeGroup)?.label ?? location.typeGroup
          }
          totalDays={totalDays}
          anchorName={nearbyType ? anchorName : null}
          highlighted={mapFocusPoiId === location.poiId}
          onLocate={mapEnabled ? () => setMapFocusPoiId(location.poiId) : undefined}
          onOpen={() => setSelectedPoiId(location.poiId)}
          onAddStop={(day) => tripActions.addStop(day, location.poiId)}
          onAddUnscheduled={() => tripActions.addStop("unscheduled", location.poiId)}
        />
      ))}
    </div>
  );

  return (
    <main className="relative px-4 pb-4 sm:px-6 lg:h-full lg:overflow-hidden lg:px-10">
      <div
        data-testid="attractions-layout"
        className={cn(
          "grid min-h-0 items-stretch gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_minmax(320px,36%)]",
          // 展开态的 376px 留白 = Agent 面板 400px + right-4 16px - 页面右内边距 40px；
          // 面板宽度变更时需同步 agent-panel.tsx。
          agentOpen
            ? "2xl:grid-cols-[280px_minmax(0,1fr)_minmax(240px,0.85fr)_minmax(0,376px)]"
            : "2xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,0.8fr)]",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-4 lg:col-span-3 lg:row-start-1 lg:flex-nowrap xl:col-span-3">
          <TripDateCard />

          <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-hidden">
            <h1 className="shrink-0 whitespace-nowrap text-2xl leading-8 font-medium">
              {typeGroup === DEFAULT_TYPE_GROUP ? "景点" : typeLabel}
            </h1>
            {chipOptions.length > 0 ? (
              <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
                {chipOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={activeKeytag === tag}
                    onClick={() => setActiveKeytag((current) => (current === tag ? null : tag))}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm transition-colors",
                      activeKeytag === tag
                        ? "bg-[#F5F5F5] text-foreground"
                        : "border border-[#E5E5E5] bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative ml-auto w-[210px] shrink-0">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="搜索地点"
              placeholder="搜索..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-9 w-full rounded-full pr-3 pl-9 text-sm"
            />
          </div>
        </div>

        <aside className="min-h-0 min-w-0 lg:col-start-1 lg:col-span-1 lg:row-start-2 lg:h-full">
          <TripPanel embedded timeline footer={panelFooter} />
        </aside>

        <section
          data-testid="location-list"
          className="min-h-0 min-w-0 lg:col-start-2 lg:col-span-1 lg:row-start-2 lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {typeGroup === DEFAULT_TYPE_GROUP ? (
              <>
                {petRulesApply ? (
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      aria-label="显示全部地点"
                      checked={includeWithoutRules}
                      onCheckedChange={(checked) => {
                        setIncludeWithoutRules(Boolean(checked));
                        setPage(1);
                      }}
                    />
                    显示全部地点
                  </label>
                ) : null}
                {anchors.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={anchorsLoading}
                    onClick={enterNearbyLocations}
                  >
                    选择住宿/餐厅
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-[#F5F5F5] hover:bg-[#EBEBEB]"
                  onClick={backToAttractions}
                >
                  返回景点选择
                </Button>
                <div className="flex items-center gap-2">
                  <span>地点类型</span>
                  <Select value={typeGroup} onValueChange={(value) => value && changeType(value)}>
                    <SelectTrigger aria-label="地点类型筛选">
                      <SelectValue>
                        {(value: string | null) =>
                          types.find((option) => option.key === value)?.label ?? "选择类型"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {types
                          .filter((option) => NEARBY_TYPE_GROUPS.has(option.key))
                          .map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {nearbyType ? (
              <div className="flex items-center gap-2">
                <Select
                  value={anchorPoiId ?? ""}
                  onValueChange={(value) => {
                    setAnchorPoiId(value || null);
                    setPage(1);
                  }}
                  disabled={anchorsLoading || anchors.length === 0}
                >
                  <SelectTrigger aria-label="离景点最近">
                    <SelectValue>
                      {(value: string | null) =>
                        value && value !== "none" && anchorName
                          ? `离${anchorName}最近`
                          : anchorsLoading
                            ? "正在加载行程景点…"
                            : "离景点最近"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {anchors.map((anchor) => (
                        <SelectItem key={anchor.poiId} value={anchor.poiId}>
                          {anchor.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <PolicySubjectNotice subjects={policySubjects} />
          </div>

          <div className="mt-5 flex min-w-0 flex-col gap-4">
            {gated ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>请先在景点页选择行程景点</EmptyTitle>
                  <EmptyDescription>
                    住宿和餐厅会显示所选行程景点 5km 内的地点。请返回“景点”模式后先安排景点。
                  </EmptyDescription>
                </EmptyHeader>
                <Button onClick={backToAttractions}>返回景点选择</Button>
              </Empty>
            ) : locations.isError ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{anchorError ? "该景点缺少坐标，无法计算距离" : "加载地点失败"}</EmptyTitle>
                  <EmptyDescription>
                    {anchorError ? "请清除锚点后重新选择其他行程景点。" : "请稍后重试。"}
                  </EmptyDescription>
                </EmptyHeader>
                {anchorError ? <Button onClick={() => setAnchorPoiId(null)}>清除锚点</Button> : null}
              </Empty>
            ) : clientFilterActive ? (
              fullLocations.isPending ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>正在加载地点…</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : fullLocations.isError ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>加载地点失败</EmptyTitle>
                    <EmptyDescription>请稍后重试。</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : filteredItems.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>没有匹配的地点</EmptyTitle>
                    <EmptyDescription>试试其他关键词或分类筛选。</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                renderCards()
              )
            ) : !data ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>正在加载地点…</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : data.items.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{emptyTitle}</EmptyTitle>
                  {showToggleHint ? (
                    <EmptyDescription>可打开“显示全部地点”查看该类型下的所有已保存地点。</EmptyDescription>
                  ) : null}
                </EmptyHeader>
              </Empty>
            ) : (
              renderCards()
            )}

            {!gated && !locations.isError && gridTotalPages > 1 ? (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {gridTotalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= gridTotalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  下一页
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside
          data-testid="attractions-map"
          className="relative min-h-0 lg:col-start-3 lg:col-span-1 lg:row-start-2 lg:h-full"
        >
          {gated ? (
            <div
              data-testid="location-map-placeholder"
              className="flex h-full min-h-[320px] items-center justify-center rounded-[22px] border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
            >
              选择锚点后显示地图
            </div>
          ) : (
            <>
              <LocationMap
                points={
                  mapEnabled
                    ? clientFilterActive
                      ? filteredItems
                      : (fullLocations.data ?? [])
                    : []
                }
                typeLabel={typeLabel}
                anchorName={nearbyType ? anchorName : null}
                focusPoiId={mapFocusPoiId}
                showInfoWindow={!mapDetailPoiId}
                onSelect={setMapFocusPoiId}
                onOpenDetail={setMapDetailPoiId}
                loading={mapEnabled && fullLocations.isPending}
                className="rounded-[22px] border-0"
              />
              {mapDetailPoiId ? (
                <MapLocationCard
                  poiId={mapDetailPoiId}
                  point={fullLocations.data?.find((point) => point.poiId === mapDetailPoiId) ?? null}
                  typeLabel={typeLabel}
                  anchorName={nearbyType ? anchorName : null}
                  onClose={() => {
                    setMapDetailPoiId(null);
                    setMapFocusPoiId(null);
                  }}
                />
              ) : null}
            </>
          )}
        </aside>

        {agentOpen ? (
          <div
            aria-hidden="true"
            className="pointer-events-none hidden 2xl:col-span-1 2xl:col-start-4 2xl:row-start-2 2xl:block"
          />
        ) : null}
      </div>

      {selectedPoiId ? (
        <LocationDetailDialog
          poiId={selectedPoiId}
          typeLabel={typeLabel}
          onClose={() => setSelectedPoiId(null)}
        />
      ) : null}
    </main>
  );
}
