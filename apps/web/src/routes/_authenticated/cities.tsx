import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { PolicyTags, PolicySubjectNotice } from "@/components/trip/policy-tags";
import { formatAllowedPetTypes } from "@/lib/attraction-pet-rules";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { matchCityCandidate } from "@/lib/trip/policy-match";
import {
  useActiveTrip,
  useDraftTrip,
  usePolicySubjects,
  useTripCity,
} from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { runViewTransition } from "@/lib/view-transition";
import { attractionsQueryOptions } from "@/queries/attractions";
import { cityPetPolicyQueryOptions } from "@/queries/city-pet-policy";
import { destinationsQueryOptions } from "@/queries/destinations";
import { petProfileQueryOptions } from "@/queries/pet-profile";
import { petsQueryOptions } from "@/queries/pets";

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const active = useActiveTrip();
  const draft = useDraftTrip();
  const contextAdcode = active?.cityAdcode ?? draft?.cityAdcode ?? null;

  if (contextAdcode) {
    return <CityDetailView adcode={contextAdcode} mode={active ? "active" : "draft"} />;
  }
  return <CityCandidates />;
}

function CityCandidates() {
  const isClient = typeof window !== "undefined";
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const subjects = usePolicySubjects();
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });

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

  const handleSelect = (candidate: DestinationCandidate) => {
    runViewTransition(() => {
      tripActions.cacheCity({
        adcode: candidate.adcode,
        name: candidate.name,
        province: candidate.province,
      });
      tripActions.startDraft(candidate.adcode, 1, petsQuery.data?.[0]?.id ?? null);
    });
  };

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

      {subjects.status === "error" ? <PolicySubjectNotice subjects={subjects} /> : null}
      {subjects.status === "none" ? (
        <p className="text-sm text-muted-foreground">
          尚未添加宠物档案，
          <Link to="/paws" className="underline underline-offset-2">
            先去添加宠物
          </Link>
          后可查看逐宠物匹配标签。
        </p>
      ) : null}

      {candidates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
            <EmptyDescription>试试更换关键词或关闭宠物友好筛选。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((candidate) => (
            <Card key={candidate.adcode} className="relative">
              <CardHeader>
                <CardTitle>{candidate.name}</CardTitle>
                <CardDescription>{candidate.province}</CardDescription>
              </CardHeader>
              <CardContent>
                <PolicyTags
                  subjects={subjects}
                  match={(pet) => matchCityCandidate(candidate, pet)}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" onClick={() => handleSelect(candidate)}>
                  选定
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function CityDetailView({ adcode, mode }: { adcode: string; mode: "active" | "draft" }) {
  const cache = useTripCity();
  const destinations = useQuery(destinationsQueryOptions({}));
  const policy = useQuery(cityPetPolicyQueryOptions(adcode, null));
  const attractions = useQuery(
    attractionsQueryOptions({
      regionCode: adcode,
      includeWithoutRules: true,
      page: 1,
      pageSize: 1,
    }),
  );

  const candidate = destinations.data?.find((city) => city.adcode === adcode) ?? null;
  const city =
    candidate ??
    (cache?.adcode === adcode
      ? { adcode: cache.adcode, name: cache.name, province: cache.province }
      : null);
  const cityName = city?.name ?? adcode;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{cityName}</h1>
          <p className="text-sm text-muted-foreground">
            {city?.province ?? "省份未收录"}
            {mode === "draft" ? " · 草稿未确认" : " · 行程已激活"}
          </p>
        </div>
        {mode === "draft" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => runViewTransition(() => tripActions.discardDraft())}
          >
            放弃草稿
          </Button>
        ) : null}
      </header>

      {mode === "draft" ? (
        <Alert>
          <AlertTitle>行程草稿待确认</AlertTitle>
          <AlertDescription>
            在左下角行程面板选择天数（1–7）与宠物后确认，即可开始排期。
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>城市携宠条件</CardTitle>
          <CardDescription>
            {policy.data?.covered ? "已收录当地政策要点" : "暂无当地政策数据"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label="允许宠物类型"
              value={formatAllowedPetTypes(candidate?.allowedPetTypes ?? null) ?? "暂未配置"}
            />
            <DetailItem
              label="肩高上限"
              value={
                candidate?.maxSinglePetShoulderHeightCm == null
                  ? "不限制"
                  : `${candidate.maxSinglePetShoulderHeightCm} cm`
              }
            />
            <DetailItem
              label="可携带犬种"
              value={
                policy.data && policy.data.allowedBreeds.length > 0
                  ? policy.data.allowedBreeds.slice(0, 6).join("、")
                  : "暂未收录"
              }
            />
            <DetailItem
              label="已保存景点"
              value={attractions.data ? `${attractions.data.totalElements} 个` : "加载中…"}
            />
          </dl>

          {policy.data?.policies.length ? (
            <div>
              <h2 className="text-sm font-medium">政策要点</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {policy.data.policies.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            to="/destinations/$adcode/policy"
            params={{ adcode }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            查看完整城市政策
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
