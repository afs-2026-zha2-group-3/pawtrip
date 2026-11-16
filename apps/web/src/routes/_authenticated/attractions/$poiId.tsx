import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { attractionDetailQueryOptions } from "../../../queries/attractions";
import { PetFriendlyBadge } from "./-pet-friendly-badge";
import { PetPolicyFields } from "./-pet-policy-fields";

export const Route = createFileRoute("/_authenticated/attractions/$poiId")({
  component: AttractionDetailPage,
});

function AttractionDetailPage() {
  const { poiId } = Route.useParams();
  const navigate = useNavigate();
  const detail = useQuery({
    ...attractionDetailQueryOptions(poiId),
    throwOnError: true,
  });

  if (!detail.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载景点详情…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const attraction = detail.data;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/attractions" })}>
          返回景点列表
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{attraction.name}</CardTitle>
          <CardDescription>景点 · {attraction.address ?? "地址未收录"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PetFriendlyBadge maxPetsPerPerson={attraction.petPolicies.maxPetsPerPerson} />
          <PetPolicyFields policies={attraction.petPolicies} />
        </CardContent>
      </Card>
    </main>
  );
}
