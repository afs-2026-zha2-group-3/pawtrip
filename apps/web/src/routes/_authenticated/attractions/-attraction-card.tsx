import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AttractionSummary } from "../../../queries/attractions";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

export function AttractionCard({
  attraction,
  onOpen,
}: {
  attraction: AttractionSummary;
  onOpen: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{attraction.name}</CardTitle>
        <CardDescription>{attraction.address ?? "地址未收录"}</CardDescription>
      </CardHeader>
      <CardContent>
        <PetFriendlyBadge maxPetsPerPerson={attraction.maxPetsPerPerson} />
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" onClick={onOpen}>
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );
}
