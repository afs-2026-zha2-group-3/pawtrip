import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, CircleFadingPlus, X } from "lucide-react";
import cover1 from "@/assets/city-covers/cover-1.png";
import cover2 from "@/assets/city-covers/cover-2.png";
import cover3 from "@/assets/city-covers/cover-3.png";
import cover4 from "@/assets/city-covers/cover-4.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { scoreCity, sortByRecommendation } from "@/lib/destination-recommendation";
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
import { petsQueryOptions } from "@/queries/pets";
import { CityTripDialog } from "./-city-trip-dialog";

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

const CITY_COVERS = [cover1, cover2, cover3, cover4];
const PAGE_SIZE = 9;

function CitiesPage() {
  const isClient = typeof window !== "undefined";
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const [selectedAdcode, setSelectedAdcode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dialogCity, setDialogCity] = useState<DestinationCandidate | null>(null);
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
  // REQ-014 修订：徽标政策判定取第一只宠物（与打分同口径；subjects 在有激活行程时会被替换为行程宠物，不适用）
  const pets = useQuery({ ...petsQueryOptions(), enabled: isClient, throwOnError: false });
  const firstPet = pets.data?.[0] ?? null;
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

  // REQ-014：渲染前按首宠喜好/性格打分排序；profile 晚到时自动重排（design D6）
  const candidates = sortByRecommendation(destinations.data, profile.data ?? null);
  const pageCount = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleCandidates = candidates.slice(pageStart, pageStart + PAGE_SIZE);
  const selected =
    candidates.find((candidate) => candidate.adcode === selectedAdcode) ?? null;

  return (
    <main
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6",
        selected ? "max-w-[1408px]" : "max-w-5xl",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-6 rounded-[22px] border-2 border-[#EC9455] bg-card p-6 shadow-md",
          selected &&
            "min-[1408px]:grid min-[1408px]:grid-cols-[minmax(0,976px)_360px] min-[1408px]:items-start",
        )}
      >
        <section className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <h1 className="text-2xl font-medium leading-8 text-foreground">
                宠物友好热门城市
              </h1>
              <label className="flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-2.5 text-sm text-foreground hover:bg-muted">
                <Checkbox
                  aria-label="宠物友好筛选"
                  checked={friendlyOnly}
                  onCheckedChange={(checked) => setFriendlyOnly(checked)}
                />
                宠物友好
              </label>
            </div>
            <div className="relative">
              <CircleFadingPlus
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="搜索城市"
                placeholder="搜索..."
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="h-9 w-[210px] rounded-full border-border bg-card pl-9 text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              共 {candidates.length} 个候选 · 点击卡片查看政策
            </span>
            {active ? (
              <p className="text-sm text-muted-foreground">
                当前已有激活行程，请先在 我的行程 取消激活后再选择新城市。
              </p>
            ) : null}
            {subjects.status === "error" ? (
              <PolicySubjectNotice subjects={subjects} />
            ) : null}
            {subjects.status === "none" ? (
              <p className="text-sm text-muted-foreground">
                尚未添加宠物档案，
                <Link to="/paws" className="underline underline-offset-2">
                  先去添加宠物
                </Link>
                后可查看逐宠物匹配标签。
              </p>
            ) : null}
          </div>

          {candidates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
                <EmptyDescription>
                  试试更换关键词或关闭宠物友好筛选。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCandidates.map((candidate, index) => (
                  <CityCard
                    key={candidate.adcode}
                    candidate={candidate}
                    cover={
                      CITY_COVERS[
                        (pageStart + index) % CITY_COVERS.length
                      ]
                    }
                    recommended={
                      // REQ-014 修订（2026-11-17）：徽标 = 得分 >0 且首宠政策判定非「明确违反」
                      // （matchCityCandidate：friendly/unjudgeable 均展示，仅 unfriendly 隐藏；排序不受政策影响）
                      scoreCity(
                        candidate.featureTags,
                        profile.data?.preferences ?? [],
                        profile.data?.personality ?? null,
                      ) > 0 &&
                      firstPet != null &&
                      matchCityCandidate(candidate, firstPet).status !== "unfriendly"
                    }
                    selected={selected?.adcode === candidate.adcode}
                    disabled={Boolean(active)}
                    subjects={subjects}
                    onSelect={() => setSelectedAdcode(candidate.adcode)}
                    onPick={() => {
                      setSelectedAdcode(candidate.adcode);
                      setDialogCity(candidate);
                    }}
                  />
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
        </section>

        {selected ? (
          <CityPolicyPane
            key={selected.adcode}
            adcode={selected.adcode}
            name={selected.name}
            onClose={() => setSelectedAdcode(null)}
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

function CityCard({
  candidate,
  cover,
  recommended,
  selected,
  disabled,
  subjects,
  onSelect,
  onPick,
}: {
  candidate: DestinationCandidate;
  cover: string;
  recommended: boolean;
  selected: boolean;
  disabled: boolean;
  subjects: PolicySubjects;
  onSelect: () => void;
  onPick: () => void;
}) {
  return (
    <article
      data-slot="card"
      data-testid="city-card"
      data-adcode={candidate.adcode}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative flex cursor-pointer flex-col gap-5 rounded-[22px] border bg-card p-4 shadow-[0_2px_8px_0_rgba(38,31,18,0.04)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-[#EC9455]" : "border-[#E0E0E0]",
      )}
    >
      {recommended ? (
        <Badge className="absolute right-2 top-2" aria-label="系统推荐">
          系统推荐
        </Badge>
      ) : null}
      <img
        src={cover}
        alt={`${candidate.name}景观示意图`}
        className="h-[100px] w-full rounded-[14px] object-cover"
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        title={disabled ? "请先在 我的行程 取消激活当前行程" : undefined}
        onClick={(event) => {
          event.stopPropagation();
          onPick();
        }}
        className={cn(
          "absolute right-4 top-[106px] h-9 rounded-full px-2.5 text-sm font-medium shadow-sm",
          selected
            ? "border-[#404040] bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#0A0A0A]/90 hover:text-[#FAFAFA]"
            : "border-[#E5E5E5] bg-card text-foreground hover:bg-muted",
        )}
      >
        Pick
      </Button>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium leading-7 text-[#262626]">
          {candidate.name}
        </h2>
        <span className="inline-flex h-[21px] w-fit items-center rounded-md bg-[#FFEFD6] px-1.5 text-xs font-medium text-[#F76B15]">
          {candidate.province}
        </span>
        <PolicyTags
          subjects={subjects}
          match={(pet) => matchCityCandidate(candidate, pet)}
          className="gap-2"
        />
      </div>
    </article>
  );
}

function CityPolicyPane({
  adcode,
  name,
  onClose,
}: {
  adcode: string;
  name: string;
  onClose: () => void;
}) {
  const policyQuery = useQuery(cityPetPolicyQueryOptions(adcode, null));
  const subjects = usePolicySubjects();
  const policy = policyQuery.data;

  return (
    <aside
      role="region"
      aria-label="城市宠物管理政策"
      className="paw-scroll flex min-w-0 flex-col gap-4 min-[1408px]:sticky min-[1408px]:top-6 min-[1408px]:max-h-[calc(100vh-3rem)] min-[1408px]:self-start min-[1408px]:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xl font-semibold leading-7 text-foreground">
            {name}宠物管理政策
          </h2>
          {policy?.updatedMonth ? (
            <p className="text-sm text-[#8E8C99]">更新于 {policy.updatedMonth}</p>
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
      </div>

      {policyQuery.isPending ? (
        <div
          className="h-40 animate-pulse rounded-[14px] bg-muted"
          aria-busy="true"
        >
          <span className="sr-only">正在加载政策…</span>
        </div>
      ) : policyQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          暂时无法读取{name}的宠物管理政策，请稍后重试。
        </p>
      ) : !policy?.covered ? (
        <div className="rounded-[14px] bg-muted/50 p-4">
          <p className="text-sm font-medium text-foreground">暂无当地政策数据</p>
          <p className="mt-1 text-sm text-muted-foreground">
            当前仅覆盖已录入政策的城市；未收录不代表可以携宠进入，请以当地政府最新文件为准。
          </p>
        </div>
      ) : (
        <>
          <PolicyMatchBanner policy={policy} subjects={subjects} cityName={name} />
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BookOpen aria-hidden="true" className="size-5 text-foreground" />
              <h3 className="text-base font-medium text-foreground">政策要点</h3>
            </div>
            <ul className="list-disc space-y-2 pl-7 text-sm leading-6 text-foreground">
              {policy.policies.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <div className="flex flex-col items-start gap-1">
            <Link
              to="/destinations/$adcode/policy"
              params={{ adcode }}
              hash="banned-breeds"
              className="text-sm text-[#1677ff] underline underline-offset-2"
            >
              {name}禁养犬名单
            </Link>
            <Link
              to="/destinations/$adcode/policy"
              params={{ adcode }}
              className="text-sm underline underline-offset-2"
            >
              查看完整政策与来源
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}

function PolicyMatchBanner({
  policy,
  subjects,
  cityName,
}: {
  policy: CityPetPolicy;
  subjects: PolicySubjects;
  cityName: string;
}) {
  if (subjects.status !== "ready" || subjects.subjects.length === 0) {
    return (
      <section className="flex flex-col gap-1 rounded-[14px] bg-[#FFEFD6] p-4">
        <h3 className="text-lg font-medium text-foreground">基于宠物档案的推荐</h3>
        <p className="text-sm text-[#8E8C99]">
          添加宠物档案后，这里会显示是否命中当地禁养名单。
        </p>
      </section>
    );
  }

  const verdicts = subjects.subjects.map((pet) => ({
    pet,
    verdict: matchCityPolicy(policy, pet),
  }));
  const blocked = verdicts.filter(({ verdict }) => verdict.status === "unfriendly");

  return (
    <section className="flex flex-col gap-1 rounded-[14px] bg-[#FFEFD6] p-4">
      <h3
        className={cn(
          "text-lg font-medium",
          blocked.length > 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {blocked.length > 0 ? "命中禁养名单" : "未命中禁养名单"}
      </h3>
      {verdicts.map(({ pet, verdict }) => (
        <p key={pet.id} className="text-sm text-[#8E8C99]">
          {verdict.status === "unfriendly"
            ? `${pet.name}：${verdict.reasons.join("；")}。建议更换目的地或提前确认当地最新规定。`
            : verdict.status === "friendly"
              ? `您的宠物${pet.name}不在${cityName}禁养名单中。`
              : `${pet.name}：${verdict.reasons.join("；")}。`}
        </p>
      ))}
      {blocked.length === 0 ? (
        <p className="text-sm text-[#8E8C99]">
          仍需遵守当地关于数量、牵引、疫苗等其他规定。
        </p>
      ) : null}
    </section>
  );
}