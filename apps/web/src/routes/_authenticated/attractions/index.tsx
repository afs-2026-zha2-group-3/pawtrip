import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useSelectedDestination } from "../../../lib/selected-destination";
import { attractionsQueryOptions } from "../../../queries/attractions";
import { AttractionCard } from "./-attraction-card";

export const Route = createFileRoute("/_authenticated/attractions/")({
  component: AttractionsPage,
});

const PAGE_SIZE = 20;

function AttractionsPage() {
  const isClient = typeof window !== "undefined";
  const navigate = useNavigate();
  const selected = useSelectedDestination();
  const [includeWithoutRules, setIncludeWithoutRules] = useState(false);
  const [page, setPage] = useState(1);
  const regionCode = selected?.adcode ?? "";
  const attractions = useQuery({
    ...attractionsQueryOptions({ regionCode, includeWithoutRules, page, pageSize: PAGE_SIZE }),
    enabled: isClient && Boolean(regionCode),
    throwOnError: true,
    placeholderData: keepPreviousData,
  });
  const friendlyEmpty =
    !includeWithoutRules && attractions.data !== undefined && attractions.data.totalElements === 0;
  const anyAttractions = useQuery({
    ...attractionsQueryOptions({ regionCode, includeWithoutRules: true, page: 1, pageSize: 1 }),
    enabled: isClient && Boolean(regionCode) && friendlyEmpty,
  });

  if (!isClient) {
    return null;
  }

  if (!selected) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>请先选择目的地</EmptyTitle>
            <EmptyDescription>选择目的地后才能查看该城市的景点。</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => void navigate({ to: "/cities" })}>去选择目的地</Button>
        </Empty>
      </main>
    );
  }

  if (!attractions.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载景点…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const data = attractions.data;
  const checkingAny = friendlyEmpty && anyAttractions.isPending;
  const anyExists = (anyAttractions.data?.totalElements ?? 0) > 0;
  const emptyTitle = includeWithoutRules
    ? "该城市暂无已保存景点"
    : checkingAny
      ? "正在确认该城市景点…"
      : anyExists
        ? "该城市暂无宠物友好的已保存景点"
        : "该城市暂无已保存景点";
  const showToggleHint = !includeWithoutRules && !checkingAny && anyExists;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-lg font-medium">{selected.cityName}景点</h1>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            aria-label="显示全部景点"
            checked={includeWithoutRules}
            onCheckedChange={(checked) => {
              setIncludeWithoutRules(Boolean(checked));
              setPage(1);
            }}
          />
          显示全部景点
        </label>
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          共 {data.totalElements} 个景点
        </span>
      </div>

      {data.items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            {showToggleHint ? (
              <EmptyDescription>可打开“显示全部景点”查看所有已保存景点。</EmptyDescription>
            ) : null}
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((attraction) => (
            <AttractionCard
              key={attraction.poiId}
              attraction={attraction}
              onOpen={() =>
                void navigate({
                  to: "/attractions/$poiId",
                  params: { poiId: attraction.poiId },
                })
              }
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
    </main>
  );
}
