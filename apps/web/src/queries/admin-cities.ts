import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { Page, PetPolicies } from "./admin-locations";

export type CityLevelFilter = "city" | "province";

export interface CityListParams {
  provinceAdcode?: string;
  level?: CityLevelFilter;
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface CityListItem {
  adcode: string;
  name: string;
  level: string;
  provinceAdcode: string;
  provinceName: string;
  petPolicies: PetPolicies;
}

export interface CityDetail extends CityListItem {
  allowedDogBreedIds: number[];
}

export interface UpdateCityInput {
  petPolicies?: PetPolicies | null;
  allowedDogBreedIds?: number[] | null;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

function cityListKeyParams(params: CityListParams) {
  return {
    provinceAdcode: params.provinceAdcode ?? null,
    level: params.level ?? null,
    keyword: params.keyword?.trim() ?? "",
    page: params.page,
    pageSize: params.pageSize,
  };
}

export const adminCityQueryKeys = {
  all: ["admin", "cities"] as const,
  list: (params: CityListParams) => ["admin", "cities", "list", cityListKeyParams(params)] as const,
  detail: (adcode: string) => ["admin", "cities", "detail", adcode] as const,
};

export function citiesQueryOptions(params: CityListParams) {
  return queryOptions({
    queryKey: adminCityQueryKeys.list(params),
    queryFn: ({ signal }) =>
      request<Page<CityListItem>>(`/api/admin/cities?${queryString({
        provinceAdcode: params.provinceAdcode,
        level: params.level,
        keyword: params.keyword?.trim(),
        page: params.page,
        pageSize: params.pageSize,
      })}`, { signal }),
  });
}

export function cityDetailQueryOptions(adcode: string) {
  return queryOptions({
    queryKey: adminCityQueryKeys.detail(adcode),
    queryFn: ({ signal }) =>
      request<CityDetail>(`/api/admin/cities/${encodeURIComponent(adcode)}`, { signal }),
  });
}

export function updateCity(adcode: string, input: UpdateCityInput): Promise<CityDetail> {
  return request<CityDetail>(`/api/admin/cities/${encodeURIComponent(adcode)}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateCityMutationOptions(adcode: string) {
  return mutationOptions({
    mutationKey: [...adminCityQueryKeys.all, "update", adcode],
    mutationFn: (input: UpdateCityInput) => updateCity(adcode, input),
  });
}
