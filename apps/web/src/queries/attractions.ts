import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { AttractionPetPolicies } from "../lib/attraction-pet-rules";

export interface AttractionSummary {
  poiId: string;
  name: string;
  typeCode: string;
  typeGroup: string;
  address: string | null;
  regionCode: string | null;
  maxPetsPerPerson: number | null;
}

export interface AttractionDetail {
  poiId: string;
  name: string;
  typeCode: string;
  typeGroup: string;
  address: string | null;
  regionCode: string | null;
  petPolicies: AttractionPetPolicies;
}

export interface AttractionPage {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  items: AttractionSummary[];
}

export interface AttractionListParams {
  regionCode: string;
  includeWithoutRules: boolean;
  page: number;
  pageSize: number;
}

export function attractionsQueryOptions(params: AttractionListParams) {
  const search = new URLSearchParams({
    regionCode: params.regionCode,
    includeWithoutRules: String(params.includeWithoutRules),
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  return queryOptions({
    queryKey: [
      "attractions",
      params.regionCode,
      params.includeWithoutRules,
      params.page,
      params.pageSize,
    ],
    queryFn: ({ signal }) =>
      request<AttractionPage>(`/api/locations/attractions?${search.toString()}`, { signal }),
  });
}

export function attractionDetailQueryOptions(poiId: string) {
  return queryOptions({
    queryKey: ["attractions", "detail", poiId],
    queryFn: ({ signal }) =>
      request<AttractionDetail>(`/api/locations/${encodeURIComponent(poiId)}`, { signal }),
  });
}
