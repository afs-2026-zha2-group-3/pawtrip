import type { Pet } from "@/queries/pets";
import type { PolicyStatus, PolicyVerdict } from "@/lib/trip/policy-match";
import type { PolicySubjects } from "@/lib/trip/policy-subjects";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<PolicyStatus, string> = {
  friendly: "友好",
  unfriendly: "不友好",
  unjudgeable: "无法判定",
  unconfigured: "未配置",
};

const STATUS_CLASSES: Record<PolicyStatus, string> = {
  friendly: "bg-emerald-600/10 text-emerald-700 ring-emerald-600/25",
  unfriendly: "bg-destructive/10 text-destructive ring-destructive/25",
  unjudgeable: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  unconfigured: "bg-muted text-muted-foreground ring-foreground/10",
};

export function PolicyVerdictTag({
  pet,
  verdict,
}: {
  pet: Pet;
  verdict: PolicyVerdict;
}) {
  return (
    <span
      data-status={verdict.status}
      title={verdict.reasons.join("；")}
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_CLASSES[verdict.status],
      )}
    >
      {pet.name} · {STATUS_LABELS[verdict.status]}
    </span>
  );
}

export function PolicySubjectNotice({ subjects }: { subjects: PolicySubjects }) {
  if (subjects.status === "error") {
    return (
      <p className="text-sm text-destructive" role="alert">
        暂时无法读取宠物档案，请稍后重试。
      </p>
    );
  }
  if (subjects.status === "loading") {
    return <p className="text-sm text-muted-foreground">正在读取宠物档案…</p>;
  }
  return null;
}

export function PolicyTags({
  subjects,
  match,
  className,
}: {
  subjects: PolicySubjects;
  match: (pet: Pet) => PolicyVerdict;
  className?: string;
}) {
  if (subjects.status !== "ready" || subjects.subjects.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {subjects.subjects.map((pet) => (
        <PolicyVerdictTag key={pet.id} pet={pet} verdict={match(pet)} />
      ))}
    </div>
  );
}
