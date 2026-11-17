import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { matchCityPolicy } from "@/lib/trip/policy-match";
import { usePolicySubjects } from "@/lib/trip/selectors";
import {
  cityPetPolicyQueryOptions,
  type CityPetPolicy,
} from "@/queries/city-pet-policy";

export const Route = createFileRoute(
  "/_authenticated/destinations/$adcode/policy",
)({
  component: CityPetPolicyPage,
});

function CityPetPolicyPage() {
  const { adcode } = Route.useParams();
  const { data: policy, isPending } = useQuery(cityPetPolicyQueryOptions(adcode, null));

  if (isPending || !policy) {
    return (
      <PageFrame>
        <Card>
          <CardHeader>
            <CardTitle>正在加载养宠政策…</CardTitle>
          </CardHeader>
        </Card>
      </PageFrame>
    );
  }

  if (!policy.covered) {
    return (
      <PageFrame>
        <Card>
          <CardHeader>
            <CardTitle>{policy.name}的养宠政策</CardTitle>
            <CardDescription>暂无当地政策数据</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              当前仅覆盖已录入政策的城市；未收录不代表可以携宠进入，请以当地政府最新文件为准。
            </p>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{policy.name}养宠政策</h1>
        {policy.areaScope ? (
          <p className="text-sm text-muted-foreground">
            适用范围：{policy.areaScope}
          </p>
        ) : null}
        {policy.updatedMonth ? (
          <p className="text-sm text-muted-foreground">
            更新于 {policy.updatedMonth}
          </p>
        ) : null}
      </header>

      <CityPolicyMatch policy={policy} />

      <Card>
        <CardHeader>
          <CardTitle>政策要点</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5">
            {policy.policies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
        </CardContent>
      </Card>

      {policy.source ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>来源与时效</CardTitle>
            <CardDescription>{policy.source.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {policy.source.note ? (
              <p className="text-sm text-muted-foreground">
                {policy.source.note}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              以上内容为公开文件摘录，仅供参考，以当地政府最新文件为准。
            </p>
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}

function CityPolicyMatch({ policy }: { policy: CityPetPolicy }) {
  const subjects = usePolicySubjects();

  if (subjects.status === "error") {
    return (
      <Notice
        title="暂时无法读取宠物档案"
        description="请稍后重试，或先在「Paws」中确认宠物档案信息。"
      />
    );
  }
  if (subjects.status === "loading") {
    return (
      <Notice
        title="正在读取宠物档案"
        description="宠物档案加载完成后将按统一匹配主体给出结论。"
      />
    );
  }
  if (subjects.status === "none") {
    return (
      <Notice
        title="尚未填写宠物档案"
        description="请先在「Paws」中添加宠物并选择品种，这里会显示是否命中当地禁养名单。"
      />
    );
  }

  const verdicts = subjects.subjects.map((pet) => ({
    pet,
    verdict: matchCityPolicy(policy, pet),
  }));
  const blocked = verdicts.filter(({ verdict }) => verdict.status === "unfriendly");

  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
      <h2 className="text-sm font-semibold">携宠匹配结论</h2>
      <PolicyTags subjects={subjects} match={(pet) => matchCityPolicy(policy, pet)} />
      {blocked.length > 0 ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3" role="alert">
          <p className="text-sm font-medium text-destructive">禁养犬种提醒</p>
          {blocked.map(({ pet, verdict }) => (
            <p key={pet.id} className="mt-1 text-sm">
              {pet.name}：{verdict.reasons.join("；")}。建议更换目的地或提前确认当地最新规定。
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          仍需遵守当地关于数量、牵引、疫苗等其他规定。
        </p>
      )}
    </section>
  );
}

function BreedExamples({
  title,
  scope,
  breeds,
  emptyText,
  note,
}: {
  title: string;
  scope?: string | null;
  breeds: string[];
  emptyText: string;
  note: string;
}) {
  const examples = breeds.slice(0, 6);
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">
        {title}
        {scope ? `（${scope}）` : ""}
      </h3>
      {examples.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {examples.map((breed) => (
            <span
              key={breed}
              className="rounded-full bg-muted px-3 py-1 text-sm"
            >
              {breed}
            </span>
          ))}
          {breeds.length > examples.length ? (
            <span className="text-sm text-muted-foreground">
              等 {breeds.length} 种
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Notice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border bg-muted/40 p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <Link
        to="/cities"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden="true" />
        返回城市列表
      </Link>
      {children}
    </main>
  );
}
