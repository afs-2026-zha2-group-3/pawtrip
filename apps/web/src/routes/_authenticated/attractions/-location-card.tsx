import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { matchLocationPolicy } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import type { LocationSummary } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

export function LocationCard({
  location,
  typeLabel,
  totalDays,
  onOpen,
  onAddStop,
  onAddUnscheduled,
}: {
  location: LocationSummary;
  typeLabel: string;
  totalDays: number;
  onOpen: () => void;
  onAddStop: (day: number) => void;
  onAddUnscheduled: () => void;
}) {
  const subjects = usePolicySubjects();
  const active = useActiveTrip();
  const addedDays = active
    ? active.plan.days
        .filter((entry) => entry.stops.some((stop) => stop.poiId === location.poiId))
        .map((entry) => entry.day)
    : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{location.name}</CardTitle>
        <CardDescription>{location.address ?? "地址未收录"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Badge variant="outline">{typeLabel}</Badge>
                        <PetFriendlyBadge maxPetsPerPerson={location.petPolicies.maxPetsPerPerson} />
            <PolicyTags
              subjects={subjects}
              match={(pet) => matchLocationPolicy(location.petPolicies, pet)}
            />
          </div>
          {addedDays.length > 0 ? (
            <div className="flex flex-wrap items-start justify-end gap-1">
              <span className="sr-only">已加入：</span>
              {addedDays.map((day) => (
                <Badge key={day} variant="outline">
                  第 {day} 天
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onOpen}>
          查看详情
        </Button>
        <DaySelect
          label="添加到行程"
          totalDays={totalDays}
          onSelectDay={onAddStop}
        />
        <Button size="sm" variant="outline" onClick={onAddUnscheduled}>
          暂不排期
        </Button>
      </CardFooter>
    </Card>
  );
}
