import { useState } from "react";
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
import { useActiveTrip, usePolicySubjects, useTripCity } from "../../../lib/trip/selectors";
import { tripActions } from "../../../lib/trip/store";
import {
  locationTypesQueryOptions,
  locationsQueryOptions,
} from "../../../queries/locations";
import { LocationCard } from "./-location-card";
import { LocationDetailDialog } from "./-location-detail-dialog";

export const Route = createFileRoute("/_authenticated/attractions/")({
  component: AttractionsPage,
});

const PAGE_SIZE = 20;
const DEFAULT_TYPE_GROUP = "attraction";

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
      page,
      pageSize: PAGE_SIZE,
    }),
    enabled: isClient && Boolean(regionCode),
    throwOnError: true,
    placeholderData: keepPreviousData,
  });
  const friendlyEmpty =
    !includeWithoutRules && locations.data !== undefined && locations.data.totalElements === 0;
  const allLocations = useQuery({
    ...locationsQueryOptions({
      regionCode,
      typeGroup,
      petFriendlyOnly: false,
      page: 1,
      pageSize: 1,
    }),
    enabled: isClient && Boolean(regionCode) && friendlyEmpty,
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

  if (!locations.data || !locationTypes.data) {
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

  const data = locations.data;
  const cityName = city?.adcode === active.cityAdcode ? city.name : active.cityAdcode;
  const selectedType = locationTypes.data.find((option) => option.key === typeGroup);
  const typeLabel = selectedType?.label ?? "地点";
  const checkingAny = friendlyEmpty && allLocations.isPending;
  const anyExists = (allLocations.data?.totalElements ?? 0) > 0;
  const emptyTitle = includeWithoutRules
    ? `该城市暂无已保存${typeLabel}`
    : checkingAny
      ? `正在确认该城市${typeLabel}…`
      : anyExists
        ? `该城市暂无宠物友好的已保存${typeLabel}`
        : `该城市暂无已保存${typeLabel}`;
  const showToggleHint = !includeWithoutRules && !checkingAny && anyExists;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
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
                  locationTypes.data.find((option) => option.key === value)?.label ?? "选择类型"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {locationTypes.data.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
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
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          共 {data.totalElements} 个地点
        </span>
      </div>

      <PolicySubjectNotice subjects={policySubjects} />

      {data.items.length === 0 ? (
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
                locationTypes.data.find((option) => option.key === location.typeGroup)?.label
                  ?? location.typeGroup
              }
              totalDays={totalDays}
              onOpen={() => setSelectedPoiId(location.poiId)}
              onAddStop={(day) => tripActions.addStop(day, location.poiId)}
              onAddUnscheduled={() => tripActions.addStop("unscheduled", location.poiId)}
            />
          ))}
        </div>
      )}

      {data.totalPages > 1 ? (
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
