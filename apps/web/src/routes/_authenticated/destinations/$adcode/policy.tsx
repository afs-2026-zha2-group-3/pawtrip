import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoBreedFromSearch, type DemoPetSearch } from "@/lib/demo-pet-profile";
import {
  cityPetPolicyQueryOptions,
  type CityPetPolicy,
} from "@/queries/city-pet-policy";

export const Route = createFileRoute(
  "/_authenticated/destinations/$adcode/policy",
)({
  validateSearch: (search: Record<string, unknown>): DemoPetSearch => ({
    breed: typeof search.breed === "string" ? search.breed : undefined,
  }),
  component: CityPetPolicyPage,
});

function CityPetPolicyPage() {
  const { adcode } = Route.useParams();
  const breed = demoBreedFromSearch(Route.useSearch());
  const { data: policy, isPending } = useQuery(
    cityPetPolicyQueryOptions(adcode, breed),
  );

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

      <MatchNotice policy={policy} breed={breed} />

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>禁养犬种名单</CardTitle>
          <CardDescription>
            共 {policy.bannedBreeds.length} 种
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policy.bannedBreeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              当地暂未录入禁养犬种名单。
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {policy.bannedBreeds.map((name) => {
                const matched =
                  policy.match?.matched === true &&
                  policy.match.breed === name;
                return (
                  <li
                    key={name}
                    className={
                      matched
                        ? "rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                        : "rounded-full border px-3 py-1 text-xs"
                    }
                  >
                    {name}
                  </li>
                );
              })}
            </ul>
          )}
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

function MatchNotice({
  policy,
  breed,
}: {
  policy: CityPetPolicy;
  breed: string | null;
}) {
  if (policy.match?.matched) {
    return (
      <section
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-4"
        role="alert"
      >
        <h2 className="font-semibold text-destructive">禁养犬种提醒</h2>
        <p className="mt-1">
          您填写的宠物品种“{policy.match.breed}”出现在{policy.name}
          的禁养犬种名单中。
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          携犬进入该城市可能面临劝返、罚款或收容等后果，建议提前更换目的地或向当地主管部门确认。
        </p>
      </section>
    );
  }

  if (policy.match) {
    return (
      <section className="rounded-xl border border-emerald-600/40 bg-emerald-50 p-4">
        <h2 className="font-semibold text-emerald-800">未命中禁养名单</h2>
        <p className="mt-1">
          您填写的宠物品种“{policy.match.breed}”未出现在{policy.name}
          的禁养犬种名单中；这不代表允许携宠进入。
        </p>
      </section>
    );
  }

  if (!breed) {
    return (
      <section className="rounded-xl border bg-muted/40 p-4">
        <h2 className="font-semibold">尚未填写宠物档案</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          补充宠物品种后，这里会显示该品种是否命中当地禁养名单。
        </p>
      </section>
    );
  }

  if (breed === "其他") {
    return (
      <section className="rounded-xl border bg-muted/40 p-4">
        <h2 className="font-semibold">暂不判定禁养</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          您填写的宠物品种为「其他」，无法判定是否命中禁养名单。禁养匹配按品种名称精确比较。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-muted/40 p-4">
      <h2 className="font-semibold">暂不判定禁养</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        该城市暂未录入禁养犬种名单，无法判定是否命中。
      </p>
    </section>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6">{children}</main>
  );
}
