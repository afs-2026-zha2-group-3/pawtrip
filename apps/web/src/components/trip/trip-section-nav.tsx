import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const ACTIVE_CLASS = "bg-background text-foreground shadow-sm";
const INACTIVE_CLASS = "text-muted-foreground hover:text-foreground";

export function TripSectionNav({
  active,
}: {
  active: "trips" | "itinerary";
}) {
  return (
    <nav
      aria-label="行程视图"
      className="flex w-fit items-center gap-1 rounded-full bg-muted p-1 print:hidden"
    >
      <Link
        to="/trips"
        aria-current={active === "trips" ? "page" : undefined}
        className={cn(
          ITEM_CLASS,
          active === "trips" ? ACTIVE_CLASS : INACTIVE_CLASS,
        )}
      >
        我的行程
      </Link>
      <Link
        to="/itinerary"
        aria-current={active === "itinerary" ? "page" : undefined}
        className={cn(
          ITEM_CLASS,
          active === "itinerary" ? ACTIVE_CLASS : INACTIVE_CLASS,
        )}
      >
        行程单
      </Link>
    </nav>
  );
}
