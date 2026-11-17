import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import cover1 from "@/assets/city-covers/cover-1.png";
import cover2 from "@/assets/city-covers/cover-2.png";
import cover3 from "@/assets/city-covers/cover-3.png";
import cover4 from "@/assets/city-covers/cover-4.png";
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
import { cn } from "@/lib/utils";
import { amapJsKey } from "../../../lib/amap/loader";
import { ApiError } from "../../../lib/http/api-error";
import { useScheduledAttractionAnchors } from "../../../lib/trip/anchors";
import { useActiveTrip, usePolicySubjects, useTripCity } from "../../../lib/trip/selectors";
import { tripActions } from "../../../lib/trip/store";
import {
  locationTypesQueryOptions,
  locationsQueryOptions,
  mapLocationsQueryOptions,
} from "../../../queries/locations";
import { DayTimeline } from "./-day-timeline";
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
const CITY_COVERS = [cover1, cover2, cover3, cover4];

function AttractionsPage() {
  const isClient = typeof window !== "undefined";
  const navigate = useNavigate();
  const active = useActiveTrip();
  const city = useTripCity();
  const policySubjects = usePolicySubjects();
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
  const gated = typeGroup === "restaurant" && anchorPoiId === null;
  const nearbyAnchorPoiId = nearbyType ? (anchorPoiId ?? undefined) : undefined;
  const anchorName = anchorPoiId
    ? (anchors.find((anchor) => anchor.poiId === anchorPoiId)?.name ?? null)
    : null;

  const activeTripId = active?.id ?? null;
  const previousTripId = useRef(activeTripId);
  useEffect(() => {
    if (previousTripId.current !== activeTripId) {
      previousTripId.current = activeTripId;
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
  const cityName = city?.adcode === active.cityAdcode ? city.name : active.cityAdcode;
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
  const gridTotal = clientFilterActive ? filteredItems.length : (data?.totalElements ?? 0);
  const gridTotalPages = clientFilterActive
    ? Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
    : (data?.totalPages ?? 1);
  const heroCover = CITY_COVERS[Number(active.cityAdcode) % CITY_COVERS.length];

  const focusPoi = (poiId: string) => {
    setMapFocusPoiId(poiId);
    if (mapEnabled) {
      setMapDetailPoiId(poiId);
    }
  };

  const changeType = (value: string) => {
    setTypeGroup(value);
    setActiveKeytag(null);
    setPage(1);
  };

  const renderCards = () => (
    <div className="paw-grid grid gap-6 sm:grid-cols-2">
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
    <main className="relative">
      <div className="grid items-start lg:grid-cols-[minmax(0,1fr)_minmax(380px,42%)]">
        <section className="min-w-0">
          <div className="relative">
            <img
              src={heroCover}
              alt=""
              aria-hidden="true"
              className="h-44 w-full object-cover sm:h-64 lg:h-[300px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% to-background"
            />
            <div className="relative z-10 mx-4 -mt-10 w-fit lg:absolute lg:bottom-0 lg:left-[12%] lg:mx-0 lg:mt-0 lg:translate-y-1/2">
              <TripDateCard />
            </div>
          </div>

          <div className="px-4 pt-6 pb-10 sm:px-6 lg:pt-24">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-2xl leading-8 font-medium">{cityName}地点</h1>
                {chipOptions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {chipOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={activeKeytag === tag}
                        onClick={() =>
                          setActiveKeytag((current) => (current === tag ? null : tag))
                        }
                        className={cn(
                          "inline-flex h-8 items-center rounded-full px-3 text-sm transition-colors",
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
              <div className="relative w-[210px]">
                <Search
                  aria-hidden="true"
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="搜索地点"
                  placeholder="搜索..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-9 rounded-full pr-3 pl-9 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
                      {types.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {typeGroup === "hotel" ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={anchorPoiId ?? "none"}
                    onValueChange={(value) => {
                      setAnchorPoiId(value && value !== "none" ? value : null);
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
                        <SelectItem value="none">不限距离</SelectItem>
                        {anchors.map((anchor) => (
                          <SelectItem key={anchor.poiId} value={anchor.poiId}>
                            {anchor.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {!anchorsLoading && anchors.length === 0 ? (
                    <span className="text-xs text-muted-foreground">行程中还没有已排期的景点</span>
                  ) : null}
                </div>
              ) : null}
              {typeGroup === "attraction" ? (
                <div className="flex items-center gap-2">
                  <span>行程景点锚点</span>
                  <Select
                    value={anchorPoiId ?? "none"}
                    onValueChange={(value) => {
                      setAnchorPoiId(value && value !== "none" ? value : null);
                    }}
                    disabled={anchorsLoading || anchors.length === 0}
                  >
                    <SelectTrigger aria-label="行程景点锚点">
                      <SelectValue>
                        {(value: string | null) =>
                          value && value !== "none"
                            ? (anchors.find((anchor) => anchor.poiId === value)?.name ?? "已选景点")
                            : anchorsLoading
                              ? "正在加载行程景点…"
                              : "不限距离"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">不限距离</SelectItem>
                        {anchors.map((anchor) => (
                          <SelectItem key={anchor.poiId} value={anchor.poiId}>
                            {anchor.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {!anchorsLoading && anchors.length === 0 ? (
                    <span className="text-xs text-muted-foreground">行程中还没有已排期的景点</span>
                  ) : null}
                </div>
              ) : null}
              {!gated ? (
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
                  {data && !(clientFilterActive && fullLocations.isPending) ? (
                    <span className="whitespace-nowrap text-muted-foreground">
                      共 {gridTotal} 个地点
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-4">
              <PolicySubjectNotice subjects={policySubjects} />
            </div>

            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="order-2 flex w-full flex-col gap-6 lg:order-1 lg:w-[340px] lg:shrink-0">
                <DayTimeline active={active} focusPoiId={mapFocusPoiId} onFocus={focusPoi} />
                <div aria-hidden="true" className="h-px w-full bg-paw-line" />
                <TripPanel embedded />
              </div>
              <div
                aria-hidden="true"
                className="hidden w-px self-stretch bg-paw-line lg:order-2 lg:block"
              />
              <div className="order-1 flex min-w-0 flex-1 flex-col gap-4 lg:order-3">
                {gated ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>请先在景点页选择行程景点</EmptyTitle>
                      <EmptyDescription>
                        餐厅会显示所选行程景点 5km 内的地点。请返回“景点”类型选择锚点。
                      </EmptyDescription>
                    </EmptyHeader>
                    <Button onClick={() => changeType(DEFAULT_TYPE_GROUP)}>返回景点选择锚点</Button>
                  </Empty>
                ) : locations.isError ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>
                        {anchorError ? "该景点缺少坐标，无法计算距离" : "加载地点失败"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {anchorError ? "请清除锚点后重新选择其他行程景点。" : "请稍后重试。"}
                      </EmptyDescription>
                    </EmptyHeader>
                    {anchorError ? (
                      <Button onClick={() => setAnchorPoiId(null)}>清除锚点</Button>
                    ) : null}
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
                        <EmptyDescription>
                          可打开“显示全部地点”查看该类型下的所有已保存地点。
                        </EmptyDescription>
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
            </div>
          </div>
        </section>

        <aside className="relative h-80 lg:sticky lg:top-0 lg:h-svh">
          {gated ? (
            <div
              data-testid="location-map-placeholder"
              className="flex h-full min-h-[320px] items-center justify-center rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
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
                className="rounded-none border-0"
              />
              {mapDetailPoiId ? (
                <MapLocationCard
                  poiId={mapDetailPoiId}
                  point={
                    fullLocations.data?.find((point) => point.poiId === mapDetailPoiId) ?? null
                  }
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