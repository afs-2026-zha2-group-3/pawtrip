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
import { matchAttractionPolicy } from "@/lib/trip/policy-match";
import { usePolicySubjects } from "@/lib/trip/selectors";
import type { AttractionSummary } from "../../../queries/attractions";
import { DaySelect } from "./-day-select";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

export function AttractionCard({
  attraction,
  totalDays,
  onOpen,
  onAddStop,
  onAddUnscheduled,
}: {
  attraction: AttractionSummary;
  totalDays: number;
  onOpen: () => void;
  onAddStop: (day: number) => void;
  onAddUnscheduled: () => void;
}) {
  const subjects = usePolicySubjects();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{attraction.name}</CardTitle>
        <CardDescription>{attraction.address ?? "地址未收录"}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <PetFriendlyBadge maxPetsPerPerson={attraction.petPolicies.maxPetsPerPerson} />
        <PolicyTags
          subjects={subjects}
          match={(pet) => matchAttractionPolicy(attraction.petPolicies, pet)}
        />
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
