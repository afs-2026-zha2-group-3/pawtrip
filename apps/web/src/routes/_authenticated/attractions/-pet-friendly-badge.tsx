import { cn } from "@/lib/utils";
import {
  petFriendlyLabel,
  petFriendlyStatus,
  petRulesApplyTo,
} from "@/lib/attraction-pet-rules";

const STATUS_CLASSES = {
  friendly: "bg-primary/10 text-primary ring-primary/20",
  forbidden: "bg-destructive/10 text-destructive ring-destructive/20",
  unconfigured: "bg-muted text-muted-foreground ring-foreground/10",
} as const;

export function PetFriendlyBadge({
  typeGroup,
  maxPetsPerPerson,
  tone = "default",
}: {
  typeGroup: string;
  maxPetsPerPerson: number | null;
  tone?: "default" | "overlay";
}) {
  const unrestricted = !petRulesApplyTo(typeGroup) && maxPetsPerPerson === null;
  const status = unrestricted ? "friendly" : petFriendlyStatus(maxPetsPerPerson);
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex w-fit items-center rounded-full font-medium",
        tone === "overlay"
          ? "h-5 bg-[#F6C445] px-2 text-[11px] text-[#5A3B00]"
          : cn("px-2 py-0.5 text-xs ring-1 ring-inset", STATUS_CLASSES[status]),
      )}
    >
      {unrestricted ? "不限宠物" : petFriendlyLabel(maxPetsPerPerson)}
    </span>
  );
}
