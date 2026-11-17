import type { AttractionPetPolicies } from "@/lib/attraction-pet-rules";
import { petPolicyFields, petRulesApplyTo } from "@/lib/attraction-pet-rules";

export function PetPolicyFields({
  policies,
  typeGroup,
}: {
  policies: AttractionPetPolicies;
  typeGroup: string;
}) {
  const fields = petPolicyFields(policies);
  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {petRulesApplyTo(typeGroup) ? "暂无携宠政策" : "允许所有宠物，无额外限制"}
      </p>
    );
  }
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{field.label}</dt>
          <dd className="text-sm font-medium">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
