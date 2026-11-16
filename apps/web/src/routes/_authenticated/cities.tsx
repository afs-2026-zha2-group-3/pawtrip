import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import type { DestinationCandidate } from "../../lib/destination-matching";
import { matchesCityPetPolicy } from "../../lib/destination-matching";
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
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const selected = useSelectedDestination();

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const profile = useQuery({ ...petProfileQueryOptions, enabled: isClient });

  const destinations = useQuery({
    ...destinationsQueryOptions({
      keyword,
      petFriendly: friendlyOnly,
      petType: profile.data?.petType,
      breedId: profile.data?.breedId,
      shoulderHeightCm: profile.data?.shoulderHeightCm,
    }),
    enabled: isClient,
    throwOnError: true,
    placeholderData: keepPreviousData,
  });

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

  const handleSelect = (candidate: DestinationCandidate) => {
    if (selected?.adcode === candidate.adcode) {
      selectedDestinationStore.clear();
      return;
    }
    selectedDestinationStore.select({
      adcode: candidate.adcode,
      cityName: candidate.name,
      province: candidate.province,
    });
    void navigate({ to: "/attractions" });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          aria-label="搜索城市"
          placeholder="搜索城市或省份"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
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
          共 {candidates.length} 个候选
        </span>
      </div>

      {selected ? (
        <Alert>
          <AlertTitle>目的地已选定：{selected.cityName}</AlertTitle>
          <AlertDescription>
            后续政策查看、交通规则对比与行程规划将使用{selected.cityName}。
          </AlertDescription>
        </Alert>
      ) : null}
      {/* TODO: 档案品种禁养提醒——政策收录与禁养数据源确定后恢复（breedHitsBanList） */}

      {candidates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
            <EmptyDescription>试试更换关键词或关闭宠物友好筛选。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((candidate) => {
            const isSelected = selected?.adcode === candidate.adcode;
            const isMatch = profile.data
              ? matchesCityPetPolicy(candidate, profile.data)
              : null;
            return (
              <Card key={candidate.adcode} className="relative">
                {isMatch != null ? (
                  <Badge
                    variant={isMatch ? "outline" : "destructive"}
                    className={
                      isMatch
                        ? "absolute right-3 top-3 border-transparent bg-green-600 text-white"
                        : "absolute right-3 top-3"
                    }
                  >
                    {isMatch ? "匹配" : "不匹配"}
                  </Badge>
                ) : null}
                <CardHeader>
                  <CardTitle>{candidate.name}</CardTitle>
                  <CardDescription>{candidate.province}</CardDescription>
                </CardHeader>
                {/* TODO: 政策收录 Badge 与档案品种禁养 Badge——数据源确定后恢复 */}
                <CardFooter>
                  <Button
                    size="sm"
                    title={isSelected ? "点击取消选定" : undefined}
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