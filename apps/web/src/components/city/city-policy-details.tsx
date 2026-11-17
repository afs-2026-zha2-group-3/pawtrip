import { PolicyTags } from "@/components/trip/policy-tags";
import { matchCityPolicy } from "@/lib/trip/policy-match";
import { usePolicySubjects } from "@/lib/trip/selectors";
import type { CityPetPolicy } from "@/queries/city-pet-policy";

export function CityPolicyMatch({ policy }: { policy: CityPetPolicy }) {
  const subjects = usePolicySubjects();

  if (subjects.status === "error") {
    return (
      <Notice
        title="暂时无法读取宠物档案"
        description="请稍后重试，或先在「我的宠物」中确认宠物档案信息。"
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
        description="请先在「我的宠物」中添加宠物并选择品种，这里会显示是否命中当地禁养名单。"
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

export function BreedExamples({
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