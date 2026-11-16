import { cn } from "@/lib/utils";
import { petFriendlyLabel, petFriendlyStatus } from "@/lib/attraction-pet-rules";

const STATUS_CLASSES = {
  friendly: "bg-primary/10 text-primary ring-primary/20",
  forbidden: "bg-destructive/10 text-destructive ring-destructive/20",
  unconfigured: "bg-muted text-muted-foreground ring-foreground/10",
} as const;

export function PetFriendlyBadge({ maxPetsPerPerson }: { maxPetsPerPerson: number | null }) {
  const status = petFriendlyStatus(maxPetsPerPerson);
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_CLASSES[status],
      )}
    >
      {petFriendlyLabel(maxPetsPerPerson)}
    </span>
  );
}
