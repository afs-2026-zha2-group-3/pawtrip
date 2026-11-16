import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  administrativeRegionsQueryOptions,
  type AdministrativeRegion,
} from "../../../queries/admin-locations";
import {
  cityAllowedBreedsQueryKey,
  cityAllowedBreedsQueryOptions,
  updateCityAllowedBreedsMutationOptions,
} from "../../../queries/admin-city-breeds";
import { authQueryOptions } from "../../../queries/auth";

export const Route = createFileRoute("/_authenticated/admin/cities")({
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") return;

    let user;
    try {
      user = await context.queryClient.fetchQuery(authQueryOptions);
    } catch {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminCitiesPage,
});

function AdminCitiesPage() {
  const navigate = useNavigate();
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });

  // beforeLoad 在 SSR 水合时不重跑，直接访问需组件级守卫兜底（同 admin/locations 模式）
  useEffect(() => {
    if (auth.data && auth.data.role !== "ADMIN") {
      void navigate({ to: "/", replace: true });
    } else if (auth.isError) {
      void navigate({ to: "/login", replace: true });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!isClient || auth.isPending || auth.isError || auth.data?.role !== "ADMIN") {
    return null;
  }

  return <CityManagementPage />;
}

function CityManagementPage() {
  const regionsQuery = useQuery(administrativeRegionsQueryOptions());
  const cities = useMemo(
    () => flattenCities(regionsQuery.data),
    [regionsQuery.data],
  );
  const [adcode, setAdcode] = useState<string | null>(null);
  const detailQuery = useQuery(cityAllowedBreedsQueryOptions(adcode));
  const [selectedBreedIds, setSelectedBreedIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...updateCityAllowedBreedsMutationOptions(),
    onSuccess: (saved) => {
      setSelectedBreedIds(saved.allowedBreedIds);
      void queryClient.invalidateQueries({
        queryKey: cityAllowedBreedsQueryKey(saved.adcode),
      });
      void queryClient.invalidateQueries({ queryKey: ["city-pet-policy"] });
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      setSelectedBreedIds(detailQuery.data.allowedBreedIds);
    }
  }, [detailQuery.data]);

  const toggleBreed = (breedId: number) => {
    setSelectedBreedIds((current) =>
      current.includes(breedId)
        ? current.filter((id) => id !== breedId)
        : [...current, breedId].sort((left, right) => left - right),
    );
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">城市管理</h1>
        <p className="text-sm text-muted-foreground">
          维护城市可携带犬种。品种只从固定的犬种目录中选择，保存后用户查询该城市政策时会一并展示。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>可携带犬种</CardTitle>
          <CardDescription>
            选择城市后勾选允许携带的品种；未勾选的品种不会被当作可携带。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid max-w-sm gap-2 text-sm font-medium">
            城市
            <select
              aria-label="城市"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={adcode ?? ""}
              onChange={(event) => setAdcode(event.target.value || null)}
              disabled={regionsQuery.isPending}
            >
              <option value="">选择城市</option>
              {cities.map((city) => (
                <option key={city.adcode} value={city.adcode}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          {!adcode ? (
            <p className="text-sm text-muted-foreground">请先选择城市。</p>
          ) : detailQuery.isPending ? (
            <p className="text-sm text-muted-foreground">正在加载犬种目录…</p>
          ) : detailQuery.isError || !detailQuery.data ? (
            <p className="text-sm text-destructive">加载失败，请稍后重试。</p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {detailQuery.data.breeds.map((breed) => (
                  <label
                    key={breed.id}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedBreedIds.includes(breed.id)}
                      onCheckedChange={() => toggleBreed(breed.id)}
                    />
                    <span>{breed.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() =>
                    mutation.mutate({
                      adcode,
                      breedIds: selectedBreedIds,
                    })
                  }
                  disabled={mutation.isPending}
                >
                  保存
                </Button>
                {mutation.isSuccess ? (
                  <span className="text-sm text-emerald-700">已保存</span>
                ) : null}
                {mutation.isError ? (
                  <span className="text-sm text-destructive">
                    保存失败，请重试。
                  </span>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function flattenCities(
  regions: AdministrativeRegion[] | undefined,
): AdministrativeRegion[] {
  return (regions ?? [])
    .flatMap((province) => province.children)
    .filter((region) => region.level === "city");
}
