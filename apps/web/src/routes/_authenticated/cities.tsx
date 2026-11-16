import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  breedHitsBanList,
  isPetFriendlyDestination,
  matchesDestinationKeyword,
  type DestinationCandidate,
} from "../../lib/destination-matching";
import {
  selectedDestinationStore,
  useSelectedDestination,
} from "../../lib/selected-destination";
import { destinationsQueryOptions } from "../../queries/destinations";
import { petProfileQueryOptions } from "../../queries/pet-profile";

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const isClient = typeof window !== "undefined";
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const destinations = useQuery({
    ...destinationsQueryOptions,
    enabled: isClient,
    throwOnError: true,
  });
  const petProfile = useQuery({ ...petProfileQueryOptions, enabled: isClient });
  const selected = useSelectedDestination();

  if (!destinations.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载候选城市…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const candidates = destinations.data;
  const breed = petProfile.data?.breed ?? null;
  const visible = candidates.filter(
    (candidate) =>
      matchesDestinationKeyword(candidate, keyword) &&
      (!friendlyOnly || isPetFriendlyDestination(candidate, breed)),
  );
  const selectedCandidate = selected
    ? candidates.find((candidate) => candidate.adcode === selected.adcode)
    : undefined;

  const handleSelect = (candidate: DestinationCandidate) => {
    selectedDestinationStore.select({
      adcode: candidate.adcode,
      cityName: candidate.name,
      province: candidate.province,
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          aria-label="搜索城市"
          placeholder="搜索城市或省份"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="max-w-64"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            aria-label="宠物友好筛选"
            checked={friendlyOnly}
            onCheckedChange={(checked) => setFriendlyOnly(checked)}
          />
          宠物友好筛选
        </label>
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          共 {visible.length} 个候选
        </span>
      </div>
      <p className="text-xs text-muted-foreground">筛选口径（MVP 仅政策维度）</p>

      {selected ? (
        <>
          <Alert>
            <AlertTitle>目的地已选定：{selected.cityName}</AlertTitle>
            <AlertDescription>
              后续政策查看、交通规则对比与行程规划将使用{selected.cityName}。
            </AlertDescription>
          </Alert>
          {selectedCandidate && breedHitsBanList(breed, selectedCandidate.bannedBreeds) ? (
            <Alert variant="destructive">
              <AlertTitle>禁养犬种提醒</AlertTitle>
              <AlertDescription>
                档案品种「{breed}」在{selected.cityName}属于禁养犬种，出行前请确认当地政策。
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      ) : null}

      {visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
            <EmptyDescription>试试更换关键词或关闭宠物友好筛选。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((candidate) => {
            const isSelected = selected?.adcode === candidate.adcode;
            return (
              <Card key={candidate.adcode}>
                <CardHeader>
                  <CardTitle>{candidate.name}</CardTitle>
                  <CardDescription>{candidate.province} · 试点城市</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Badge variant={candidate.policyCovered ? "secondary" : "outline"}>
                    {candidate.policyCovered ? "政策已收录" : "政策未收录"}
                  </Badge>
                  {breedHitsBanList(breed, candidate.bannedBreeds) ? (
                    <Badge variant="destructive">档案品种禁养</Badge>
                  ) : null}
                </CardContent>
                <CardFooter>
                  <Button
                    size="sm"
                    disabled={isSelected}
                    onClick={() => handleSelect(candidate)}
                  >
                    {isSelected ? "已选定" : "选定"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}