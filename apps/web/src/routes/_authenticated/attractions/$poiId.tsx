import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicySubjectNotice, PolicyTags } from "@/components/trip/policy-tags";
import { matchAttractionPolicy } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { attractionDetailQueryOptions } from "../../../queries/attractions";
import { PetFriendlyBadge } from "./-pet-friendly-badge";
import { PetPolicyFields } from "./-pet-policy-fields";

export const Route = createFileRoute("/_authenticated/attractions/$poiId")({
  component: AttractionDetailPage,
});

function AttractionDetailPage() {
  const { poiId } = Route.useParams();
  const navigate = useNavigate();
  const active = useActiveTrip();
  const subjects = usePolicySubjects();
  const [activeDay, setActiveDay] = useState("1");
  const detail = useQuery({
    ...attractionDetailQueryOptions(poiId),
    throwOnError: true,
  });

  useEffect(() => {
    if (detail.data) {
      tripActions.cacheLocation(detail.data);
    }
  }, [detail.data]);

  useEffect(() => {
    if (active && Number(activeDay) > active.totalDays) {
      setActiveDay(String(active.totalDays));
    }
  }, [active, activeDay]);

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
  const day = Number(activeDay);

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
          <PolicySubjectNotice subjects={subjects} />
          <PolicyTags
            subjects={subjects}
            match={(pet) => matchAttractionPolicy(attraction.petPolicies, pet)}
          />
          <PetPolicyFields policies={attraction.petPolicies} />
          {active ? (
            <div className="flex flex-col gap-2 border-t pt-3">
              <Tabs
                value={activeDay}
                onValueChange={(value) => {
                  if (value) setActiveDay(value);
                }}
              >
                <TabsList aria-label="加入行程天数" className="max-w-full overflow-x-auto">
                  {Array.from({ length: active.totalDays }, (_, index) => index + 1).map(
                    (option) => (
                      <TabsTrigger key={option} value={String(option)}>
                        第{option}天
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => tripActions.addStop(day, attraction.poiId)}>
                  加入第 {day} 天
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => tripActions.addStop("unscheduled", attraction.poiId)}
                >
                  暂不排期
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
