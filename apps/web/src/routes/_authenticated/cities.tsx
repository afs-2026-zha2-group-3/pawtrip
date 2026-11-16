import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  MAX_TRIP_DURATION,
  MIN_TRIP_DURATION,
  parseTripDuration,
  tripDurationStore,
  useTripDuration,
} from "../../lib/trip-duration";
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
  const savedDuration = useTripDuration();
  const [durationInput, setDurationInput] = useState(String(MIN_TRIP_DURATION));
  const [durationError, setDurationError] = useState<string | null>(null);

  useEffect(() => {
    setDurationInput(savedDuration?.toString() ?? String(MIN_TRIP_DURATION));
  }, [savedDuration]);

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
    const duration = parseTripDuration(durationInput);
    if (duration == null) {
      setDurationError("请输入 1–7 之间的整数后再选定目的地。");
      return;
    }
    tripDurationStore.set(duration);
    selectedDestinationStore.select({
      adcode: candidate.adcode,
      cityName: candidate.name,
      province: candidate.province,
    });
    setDurationError(null);
    void navigate({ to: "/attractions" });
  };

  const updateDuration = (value: string) => {
    setDurationInput(value);
    const trimmed = value.trim();
    if (trimmed === "") {
      setDurationError("请输入 1–7 之间的整数。");
      return;
    }

    const parsed = parseTripDuration(trimmed);
    if (parsed != null) {
      tripDurationStore.set(parsed);
      setDurationError(null);
      return;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && numeric < MIN_TRIP_DURATION) {
      setDurationError("旅游总天数不能少于 1 天。");
    } else if (Number.isFinite(numeric) && numeric > MAX_TRIP_DURATION) {
      setDurationError("旅游总天数不能超过 7 天。");
    } else {
      setDurationError("请输入 1–7 之间的整数。");
    }
  };

  const adjustDuration = (delta: number) => {
    const current = parseTripDuration(durationInput) ?? savedDuration ?? MIN_TRIP_DURATION;
    const next = current + delta;
    if (next < MIN_TRIP_DURATION) {
      setDurationInput(String(MIN_TRIP_DURATION));
      setDurationError("旅游总天数不能少于 1 天。");
      return;
    }
    if (next > MAX_TRIP_DURATION) {
      setDurationInput(String(MAX_TRIP_DURATION));
      setDurationError("旅游总天数不能超过 7 天。");
      return;
    }
    tripDurationStore.set(next);
    setDurationInput(String(next));
    setDurationError(null);
  };

  const hasValidDuration = parseTripDuration(durationInput) != null;

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

      <section
        aria-labelledby="trip-duration-heading"
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <div>
          <h2 id="trip-duration-heading" className="font-medium">
            旅游总天数
          </h2>
          <p className="text-sm text-muted-foreground">
            先设置本次行程天数，再选定目的地；默认按 1 天安排。
          </p>
        </div>
        <div className="flex max-w-56 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="减少旅游总天数"
            onClick={() => adjustDuration(-1)}
          >
            −
          </Button>
          <Input
            id="trip-duration"
            aria-label="旅游总天数"
            aria-describedby={durationError ? "trip-duration-error" : undefined}
            aria-invalid={durationError ? true : undefined}
            type="text"
            role="spinbutton"
            aria-valuemin={MIN_TRIP_DURATION}
            aria-valuemax={MAX_TRIP_DURATION}
            aria-valuenow={parseTripDuration(durationInput) ?? undefined}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1–7"
            value={durationInput}
            onChange={(event) => updateDuration(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="增加旅游总天数"
            onClick={() => adjustDuration(1)}
          >
            +
          </Button>
        </div>
        {durationError ? (
          <p id="trip-duration-error" className="text-sm text-destructive" role="alert">
            {durationError}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">请输入 1–7 之间的整数。</p>
        )}
      </section>

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
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    disabled={!isSelected && !hasValidDuration}
                    title={isSelected ? "点击取消选定" : undefined}
                    onClick={() => handleSelect(candidate)}
                  >
                    {isSelected ? "已选定" : "选定"}
                  </Button>
                  <Link
                    to="/destinations/$adcode/policy"
                    params={{ adcode: candidate.adcode }}
                    aria-label={`查看${candidate.name}的城市政策`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    查看政策
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
