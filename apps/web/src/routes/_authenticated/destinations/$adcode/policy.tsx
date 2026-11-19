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
import {
  BreedExamples,
  CityPolicyMatch,
} from "@/components/city/city-policy-details";
import { cityPetPolicyQueryOptions } from "@/queries/city-pet-policy";

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
          <div id="banned-breeds" className="scroll-mt-[calc(var(--app-header-height)+1.5rem)]">
            <BreedExamples
              title="禁养犬种名单"
              scope={policy.areaScope}
              breeds={policy.bannedBreeds}
              emptyText="暂未收录禁养犬种名单"
              note="仅列出部分示例，完整名单请查阅当地政府通告。"
            />
          </div>
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
