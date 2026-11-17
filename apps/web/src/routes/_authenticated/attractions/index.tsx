import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PolicySubjectNotice } from "@/components/trip/policy-tags";
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
import { LocationCard } from "./-location-card";
import { LocationDetailDialog } from "./-location-detail-dialog";
import { LocationMap } from "./-location-map";
import { MapLocationCard } from "./-map-location-card";

export const Route = createFileRoute("/_authenticated/attractions/")({
  component: AttractionsPage,
});

const PAGE_SIZE = 20;
const DEFAULT_TYPE_GROUP = "attraction";
const NEARBY_TYPE_GROUPS = new Set(["hotel", "restaurant"]);

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
  const mapEnabled = Boolean(amapJsKey());
  const { anchors, loading: anchorsLoading } = useScheduledAttractionAnchors(active);

  const nearbyType = NEARBY_TYPE_GROUPS.has(typeGroup);
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
      petFriendlyOnly: !includeWithoutRules,
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
  const mapLocations = useQuery({
    ...mapLocationsQueryOptions({
      regionCode,
      typeGroup,
      petFriendlyOnly: !includeWithoutRules,
      nearPoiId: nearbyAnchorPoiId,
    }),
    enabled: isClient && mapEnabled && Boolean(regionCode) && !gated,
    throwOnError: false,
    placeholderData: keepPreviousData,
  });

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
  const emptyTitle = includeWithoutRules
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
  const showToggleHint = !includeWithoutRules && !checkingAny && anyExists;

  return (
    <main className="mx-auto w-full max-w-[1400px] p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-lg font-medium">{cityName}地点</h1>
        <div className="flex items-center gap-2 text-sm">
          <span>地点类型</span>
          <Select
            value={typeGroup}
            onValueChange={(value) => {
              if (value) {
                setTypeGroup(value);
                setPage(1);
              }
            }}
          >
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
          <div className="flex items-center gap-2 text-sm">
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
          <div className="flex items-center gap-2 text-sm">
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
            <label className="flex cursor-pointer items-center gap-2 text-sm">
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
            {data ? (
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                共 {data.totalElements} 个地点
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      <PolicySubjectNotice subjects={policySubjects} />

      {gated ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>请先在景点页选择行程景点</EmptyTitle>
            <EmptyDescription>
              餐厅会显示所选行程景点 5km 内的地点。请返回“景点”类型选择锚点。
            </EmptyDescription>
          </EmptyHeader>
          <Button
            onClick={() => {
              setTypeGroup(DEFAULT_TYPE_GROUP);
              setPage(1);
            }}
          >
            返回景点选择锚点
          </Button>
        </Empty>
      ) : locations.isError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{anchorError ? "该景点缺少坐标，无法计算距离" : "加载地点失败"}</EmptyTitle>
            <EmptyDescription>
              {anchorError ? "请清除锚点后重新选择其他行程景点。" : "请稍后重试。"}
            </EmptyDescription>
          </EmptyHeader>
          {anchorError ? (
            <Button
              onClick={() => {
                setAnchorPoiId(null);
              }}
            >
              清除锚点
            </Button>
          ) : null}
        </Empty>
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
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((location) => (
            <LocationCard
              key={location.poiId}
              location={location}
              typeLabel={
                types.find((option) => option.key === location.typeGroup)?.label
                  ?? location.typeGroup
              }
              totalDays={totalDays}
              anchorName={nearbyType ? anchorName : null}
              highlighted={mapFocusPoiId === location.poiId}
              onLocate={
                mapEnabled ? () => setMapFocusPoiId(location.poiId) : undefined
              }
              onOpen={() => setSelectedPoiId(location.poiId)}
              onAddStop={(day) => tripActions.addStop(day, location.poiId)}
              onAddUnscheduled={() => tripActions.addStop("unscheduled", location.poiId)}
            />
          ))}
        </div>
      )}

      {!gated && !locations.isError && data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasPrevious}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {data.page} / {data.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasNext}
            onClick={() => setPage((current) => current + 1)}
          >
            下一页
          </Button>
        </div>
      ) : null}
        </div>

        <aside className="relative h-80 lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)]">
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
                points={mapLocations.data ?? []}
                typeLabel={typeLabel}
                anchorName={nearbyType ? anchorName : null}
                focusPoiId={mapFocusPoiId}
                onSelect={setMapFocusPoiId}
                onOpenDetail={setMapDetailPoiId}
                loading={mapLocations.isPending}
              />
              {mapDetailPoiId ? (
                <MapLocationCard
                  poiId={mapDetailPoiId}
                  point={
                    mapLocations.data?.find((point) => point.poiId === mapDetailPoiId)
                    ?? null
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
