import { Star } from "lucide-react";
import { displayRating } from "@/lib/location-summary";

export function LocationRating({ rating }: { rating: string | null }) {
  const value = displayRating(rating);
  if (value === null) {
    return null;
  }
  return (
    <span
      data-testid="location-rating"
      className="inline-flex shrink-0 items-center gap-1 font-medium text-amber-600"
    >
      <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
      {value}
    </span>
  );
}