import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayRating } from "@/lib/location-summary";

export function LocationRating({
  rating,
  variant = "default",
}: {
  rating: string | null;
  variant?: "default" | "badge";
}) {
  const value = displayRating(rating);
  if (value === null) {
    return null;
  }
  return (
    <span
      data-testid="location-rating"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-medium",
        variant === "badge"
          ? "h-6 rounded-full bg-paw-rating px-2 text-xs text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.2)]"
          : "text-amber-600",
      )}
    >
      <Star
        aria-hidden
        className={cn(
          "size-3.5",
          variant === "badge" ? "fill-white text-white" : "fill-amber-400 text-amber-400",
        )}
      />
      {value}
    </span>
  );
}
