import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PolicySubjectNotice, PolicyTags } from "@/components/trip/policy-tags";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { matchCityCandidate } from "@/lib/trip/policy-match";
import { usePolicySubjects } from "@/lib/trip/selectors";
import { destinationsQueryOptions } from "@/queries/destinations";
import { petProfileQueryOptions } from "@/queries/pet-profile";
import { CityTripDialog } from "./-city-trip-dialog";

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const isClient = typeof window !== "undefined";
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [friendlyOnly, setFriendlyOnly] = useState(false);
  const [dialogCity, setDialogCity] = useState<DestinationCandidate | null>(null);
  const subjects = usePolicySubjects();

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const profile = useQuery({ ...petProfileQueryOptions, enabled: isClient });
  const destinations = useQuery({
    ...destinationsQueryOptions({
      keyword,
      petFriendly: friendlyOnly,
      petType: profile.data?.petType,
      breedId: profile.data?.breedId,
      shoulderHeightCm: profile.data?.shoulderHeightCm,
    }),
    enabled: isClient,
    throwOnError: true,
    placeholderData: keepPreviousData,
  });

  if (!destinations.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>正在加载候选城市…</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const candidates = destinations.data;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          aria-label="搜索城市"
          placeholder="搜索城市或省份"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          className="max-w-64"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            aria-label="宠物友好筛选"
            checked={friendlyOnly}
            onCheckedChange={(checked) => setFriendlyOnly(checked)}
          />
          宠物友好筛选
        </label>
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          共 {candidates.length} 个候选
        </span>
      </div>

      {subjects.status === "error" ? <PolicySubjectNotice subjects={subjects} /> : null}
      {subjects.status === "none" ? (
        <p className="text-sm text-muted-foreground">
          尚未添加宠物档案，
          <Link to="/paws" className="underline underline-offset-2">
            先去添加宠物
          </Link>
          后可查看逐宠物匹配标签。
        </p>
      ) : null}

      {candidates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无符合条件的目的地</EmptyTitle>
            <EmptyDescription>试试更换关键词或关闭宠物友好筛选。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((candidate) => (
            <Card key={candidate.adcode} className="relative">
              <CardHeader>
                <CardTitle>{candidate.name}</CardTitle>
                <CardDescription>{candidate.province}</CardDescription>
              </CardHeader>
              <CardContent>
                <PolicyTags
                  subjects={subjects}
                  match={(pet) => matchCityCandidate(candidate, pet)}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" onClick={() => setDialogCity(candidate)}>
                  选定
                </Button>
                <Link
                  to="/destinations/$adcode/policy"
                  params={{ adcode: candidate.adcode }}
                  aria-label={`查看${candidate.name}的城市政策`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  查看政策
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {dialogCity ? (
        <CityTripDialog
          city={dialogCity}
          onClose={() => setDialogCity(null)}
        />
      ) : null}
    </main>
  );
}
