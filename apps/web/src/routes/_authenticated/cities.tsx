import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { PolicySubjectNotice, PolicyTags } from "@/components/trip/policy-tags";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { matchCityCandidate, matchCityPolicy } from "@/lib/trip/policy-match";
import type { PolicySubjects } from "@/lib/trip/policy-subjects";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";
import {
  cityPetPolicyQueryOptions,
  type CityPetPolicy,
} from "@/queries/city-pet-policy";
import { destinationsQueryOptions } from "@/queries/destinations";
import { petProfileQueryOptions } from "@/queries/pet-profile";
import { CityTripDialog } from "./-city-trip-dialog";

const PAGE_SIZE = 9;

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const isClient = typeof window !== "undefined";
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const [dialogCity, setDialogCity] = useState<DestinationCandidate | null>(null);
  const [selectedCity, setSelectedCity] = useState<DestinationCandidate | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const active = useActiveTrip();
  const subjects = usePolicySubjects();

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPage(1);
  }, [keyword, friendlyOnly]);

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
  const pageCount = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleCandidates = candidates.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col gap-4 p-6",
        selectedCity ? "max-w-[1408px]" : "max-w-5xl",
      )}
    >
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
          共 {candidates.length} 个候选 · 点击卡片查看政策
        </span>
      </div>

      {active ? (
        <p className="text-sm text-muted-foreground">
          当前已有激活行程，请先在 Trips 取消激活后再选择新城市。
        </p>
      ) : null}
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

      <div
        className={cn(
          "gap-6",
          selectedCity &&
            "grid min-[1408px]:grid-cols-[minmax(0,976px)_360px] min-[1408px]:items-start",
        )}
      >
        <div className="flex flex-col gap-4">
          {candidates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
                <EmptyDescription>试试更换关键词或关闭宠物友好筛选。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleCandidates.map((candidate) => (
                  <Card
                    key={candidate.adcode}
                    data-testid="city-card"
                    data-adcode={candidate.adcode}
                    data-selected={
                      selectedCity?.adcode === candidate.adcode || undefined
                    }
                    tabIndex={0}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("button, a")) {
                        return;
                      }
                      setSelectedCity(candidate);
                    }}
                    onKeyDown={(event) => {
                      if ((event.target as HTMLElement).closest("button, a")) {
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCity(candidate);
                      }
                    }}
                    className={cn(
                      "relative cursor-pointer transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selectedCity?.adcode === candidate.adcode &&
                        "ring-2 ring-primary",
                    )}
                  >
                    <CardHeader>
                      <CardTitle>{candidate.name}</CardTitle>
                      <CardDescription>{candidate.province}</CardDescription>
                      <CardAction>
                        <Button
                          size="sm"
                          disabled={Boolean(active)}
                          title={
                            active ? "请先在 Trips 取消激活当前行程" : undefined
                          }
                          onClick={() => setDialogCity(candidate)}
                        >
                          选定
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <PolicyTags
                        subjects={subjects}
                        match={(pet) => matchCityCandidate(candidate, pet)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pageCount > 1 ? (
                <nav
                  aria-label="城市分页"
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <p className="text-sm text-muted-foreground">
                    第 {currentPage} / {pageCount} 页
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </div>

        {selectedCity ? (
          <CityPolicyPanel
            city={selectedCity}
            onClose={() => setSelectedCity(null)}
          />
        ) : null}
      </div>

      {dialogCity ? (
        <CityTripDialog
          city={dialogCity}
          onClose={() => setDialogCity(null)}
        />
      ) : null}
    </main>
  );
}

function CityPolicyPanel({
  city,
  onClose,
}: {
  city: DestinationCandidate;
  onClose: () => void;
}) {
  return <CityPolicyCard key={city.adcode} city={city} onClose={onClose} />;
}

function CityPolicyCard({
  city,
  onClose,
}: {
  city: DestinationCandidate;
  onClose: () => void;
}) {
  const subjects = usePolicySubjects();
  const { data: policy, isPending, isError } = useQuery(
    cityPetPolicyQueryOptions(city.adcode, null),
  );

  return (
    <section
      aria-label="城市宠物管理政策"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm min-[1408px]:sticky min-[1408px]:top-6"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold">{city.name}宠物管理政策</h2>
          {policy?.updatedMonth ? (
            <p className="text-xs text-muted-foreground">
              更新于 {policy.updatedMonth}
            </p>
          ) : null}
          {policy?.areaScope ? (
            <p className="text-xs text-muted-foreground">
              适用范围：{policy.areaScope}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="关闭城市政策"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      {isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          正在加载{city.name}的宠物管理政策…
        </p>
      ) : isError || !policy ? (
        <p role="alert" className="text-sm text-destructive">
          暂时无法读取{city.name}的宠物管理政策，请稍后重试。
        </p>
      ) : !policy.covered ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <p className="font-medium">暂无当地政策数据</p>
          <p className="text-xs text-muted-foreground">
            当前仅覆盖已录入政策的城市；未收录不代表可以携宠进入，请以当地政府最新文件为准。
          </p>
        </div>
      ) : (
        <CityPolicyContent city={city} policy={policy} subjects={subjects} />
      )}
    </section>
  );
}

function CityPolicyContent({
  city,
  policy,
  subjects,
}: {
  city: DestinationCandidate;
  policy: CityPetPolicy;
  subjects: PolicySubjects;
}) {
  return (
    <>
      <CityPolicyMatch policy={policy} subjects={subjects} />

      <section className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">政策要点</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {policy.policies.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col items-start gap-1">
        <Link
          to="/destinations/$adcode/policy"
          params={{ adcode: city.adcode }}
          hash="banned-breeds"
          className="text-sm underline underline-offset-2"
        >
          {policy.name}禁养犬名单
        </Link>
        <Link
          to="/destinations/$adcode/policy"
          params={{ adcode: city.adcode }}
          className="text-sm underline underline-offset-2"
        >
          查看完整政策与来源
        </Link>
      </div>

      {policy.source ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">来源：{policy.source.title}</p>
          {policy.source.note ? (
            <p className="text-xs text-muted-foreground">{policy.source.note}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function CityPolicyMatch({
  policy,
  subjects,
}: {
  policy: CityPetPolicy;
  subjects: PolicySubjects;
}) {
  if (subjects.status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        暂时无法读取宠物档案，请稍后重试。
      </p>
    );
  }
  if (subjects.status === "loading") {
    return (
      <p className="text-xs text-muted-foreground">正在读取宠物档案…</p>
    );
  }
  if (subjects.status === "none") {
    return (
      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        尚未添加宠物档案，
        <Link to="/paws" className="underline underline-offset-2">
          先去添加宠物
        </Link>
        后可查看是否命中当地禁养名单。
      </p>
    );
  }

  const verdicts = subjects.subjects.map((pet) => ({
    pet,
    verdict: matchCityPolicy(policy, pet),
  }));
  const blocked = verdicts.some(
    ({ verdict }) => verdict.status === "unfriendly",
  );

  return (
    <div className="flex flex-col gap-2">
      {verdicts.map(({ pet, verdict }) => (
        <p
          key={pet.id}
          className={cn(
            "rounded-lg p-3 text-xs",
            verdict.status === "unfriendly"
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-500/10 text-amber-900",
          )}
        >
          {verdict.status === "unfriendly"
            ? `您的宠物「${pet.name}」${verdict.reasons.join("；")}。`
            : verdict.status === "friendly"
              ? `您的宠物「${pet.name}」未命中${policy.name}禁养犬种名单。`
              : `您的宠物「${pet.name}」暂无法判定：${verdict.reasons.join("；")}。`}
        </p>
      ))}
      {blocked ? null : (
        <p className="text-xs text-muted-foreground">
          仍需遵守当地关于数量、牵引、疫苗等其他规定。
        </p>
      )}
    </div>
  );
}
