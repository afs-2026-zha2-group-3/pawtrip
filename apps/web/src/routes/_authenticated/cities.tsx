import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, CircleFadingPlus } from "lucide-react";
import cover1 from "@/assets/city-covers/cover-1.png";
import cover2 from "@/assets/city-covers/cover-2.png";
import cover3 from "@/assets/city-covers/cover-3.png";
import cover4 from "@/assets/city-covers/cover-4.png";
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
import {
  BreedExamples,
  CityPolicyMatch,
} from "@/components/city/city-policy-details";
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

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

const CITY_COVERS = [cover1, cover2, cover3, cover4];

function CitiesPage() {
  const isClient = typeof window !== "undefined";
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const [selectedAdcode, setSelectedAdcode] = useState<string | null>(null);
  const [dialogCity, setDialogCity] = useState<DestinationCandidate | null>(null);
  const active = useActiveTrip();
  const subjects = usePolicySubjects();

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
  const selected =
    candidates.find((candidate) => candidate.adcode === selectedAdcode) ??
    candidates[0] ??
    null;

  return (
    <main className="mx-auto w-full max-w-[1662px] px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 rounded-[22px] border-2 border-[#EC9455] bg-card p-6 shadow-md lg:grid-cols-[minmax(0,1fr)_minmax(300px,36%)]">
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
              共 {candidates.length} 个候选
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
            <div className="paw-scroll grid max-h-[65vh] gap-x-6 gap-y-9 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-none lg:grid-cols-3 lg:overflow-visible lg:pr-0">
              {candidates.map((candidate, index) => (
                <CityCard
                  key={candidate.adcode}
                  candidate={candidate}
                  cover={CITY_COVERS[index % CITY_COVERS.length]}
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
          )}
        </section>

        {selected ? (
          <CityPolicyPane
            key={selected.adcode}
            adcode={selected.adcode}
            name={selected.name}
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
  selected,
  disabled,
  subjects,
  onSelect,
  onPick,
}: {
  candidate: DestinationCandidate;
  cover: string;
  selected: boolean;
  disabled: boolean;
  subjects: PolicySubjects;
  onSelect: () => void;
  onPick: () => void;
}) {
  return (
    <article
      data-slot="card"
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

function CityPolicyPane({ adcode, name }: { adcode: string; name: string }) {
  const policyQuery = useQuery(cityPetPolicyQueryOptions(adcode, null));
  const subjects = usePolicySubjects();
  const policy = policyQuery.data;

  return (
    <aside className="paw-scroll flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xl font-semibold leading-7 text-foreground">
          {name}宠物管理政策
        </h2>
        {policy?.updatedMonth ? (
          <p className="text-sm text-[#8E8C99]">更新于 {policy.updatedMonth}</p>
        ) : null}
      </div>

      {policyQuery.isPending ? (
        <div
          className="h-40 animate-pulse rounded-[14px] bg-muted"
          aria-busy="true"
        >
          <span className="sr-only">正在加载政策…</span>
        </div>
      ) : !policy?.covered ? (
        <p className="text-sm text-muted-foreground">
          暂无当地政策数据；未收录不代表可以携宠进入，请以当地政府最新文件为准。
        </p>
      ) : (
        <>
          <PolicyMatchBanner policy={policy} subjects={subjects} cityName={name} />
          <div className="flex flex-col gap-4">
            <CityPolicyMatch policy={policy} />
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <BookOpen aria-hidden="true" className="size-6 text-foreground" />
                <h3 className="text-base font-medium text-foreground">政策要点</h3>
              </div>
              <ul className="list-disc space-y-2 pl-10 text-base leading-6 text-foreground">
                {policy.policies.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="pl-10">
                <BreedExamples
                  title="禁养犬种名单"
                  scope={policy.areaScope}
                  breeds={policy.bannedBreeds}
                  emptyText="暂未收录禁养犬种名单"
                  note="仅列出部分示例，完整名单请查阅当地政府通告。"
                />
                <BreedExamples
                  title="可携带犬种"
                  breeds={policy.allowedBreeds}
                  emptyText="暂未收录可携带犬种"
                  note="仅列出部分可选品种；仍需遵守数量、牵引、疫苗等其他规定。"
                />
              </div>
            </section>
            <section className="flex flex-col gap-1 pl-10">
              <h3 className="text-base font-medium text-foreground">来源与时效</h3>
              {policy.source ? (
                <p className="text-sm font-medium text-foreground">
                  {policy.source.title}
                </p>
              ) : null}
              {policy.source?.note ? (
                <p className="text-sm text-[#8E8C99]">{policy.source.note}</p>
              ) : null}
              <p className="text-sm text-[#8E8C99]">
                以上内容为公开文件摘录，仅供参考，以当地政府最新文件为准。
              </p>
            </section>
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
      <p className="text-sm text-[#8E8C99]">
        仍需遵守当地关于数量、牵引、疫苗等其他规定。
      </p>
    </section>
  );
}