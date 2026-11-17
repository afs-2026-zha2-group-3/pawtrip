import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  items: T[];
}

export interface LocationTypeOption {
  key: string;
  label: string;
  typeCodes: string[];
}

export interface PetPolicies {
  allowedPetTypes: string | null;
  maxPetsPerPerson: number | null;
  maxSinglePetWeightKg: number | null;
  maxSinglePetShoulderHeightCm: number | null;
  leashRequired: boolean | null;
  vaccinationProofRequired: boolean | null;
  extraFeeCents: number | null;
  reservationRequired: boolean | null;
}

export interface LocationSummary {
  poiId: string;
  name: string;
  typeCode: string;
  typeGroup: string;
  address: string | null;
  longitude: number | null;
  latitude: number | null;
  regionCode: string | null;
  minVisitHours: number | null;
  maxVisitHours: number | null;
  maxPetsPerPerson: number | null;
  petPolicies: PetPolicies;
}

export interface LocationListParams extends PaginationParams {
  regionCode?: string;
  typeGroup?: string;
  petFriendlyOnly?: boolean;
}

export interface LocationBrowseDetail {
  poiId: string;
  name: string;
  typeCode: string;
  typeGroup: string;
  address: string | null;
  regionCode: string | null;
  petPolicies: PetPolicies;
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

function locationListKeyParams(params: LocationListParams) {
  return {
    regionCode: params.regionCode ?? null,
    typeGroup: params.typeGroup ?? null,
    petFriendlyOnly: params.petFriendlyOnly ?? false,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export const locationQueryKeys = {
  all: ["locations"] as const,
  types: ["locations", "types"] as const,
  listRoot: ["locations", "list"] as const,
  list: (params: LocationListParams) => ["locations", "list", locationListKeyParams(params)] as const,
  detail: (poiId: string) => ["locations", "detail", poiId] as const,
};

export function locationTypesQueryOptions() {
  return queryOptions({
    queryKey: locationQueryKeys.types,
    queryFn: ({ signal }) => request<LocationTypeOption[]>("/api/locations/types", { signal }),
  });
}

export function locationsQueryOptions(params: LocationListParams) {
  return queryOptions({
    queryKey: locationQueryKeys.list(params),
    queryFn: ({ signal }) =>
      request<Page<LocationSummary>>(
        `/api/locations?${queryString({
          regionCode: params.regionCode,
          typeGroup: params.typeGroup,
          petFriendlyOnly: params.petFriendlyOnly,
          page: params.page,
          pageSize: params.pageSize,
        })}`,
        { signal },
      ),
  });
}

export function locationBrowseDetailQueryOptions(poiId: string) {
  return queryOptions({
    queryKey: locationQueryKeys.detail(poiId),
    queryFn: ({ signal }) =>
      request<LocationBrowseDetail>(`/api/locations/${encodeURIComponent(poiId)}`, { signal }),
  });
}
