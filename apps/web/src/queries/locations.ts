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
  distanceMeters: number | null;
  petPolicies: PetPolicies;
  coverPhotoUrl: string | null;
  rating: string | null;
}

export interface LocationListParams extends PaginationParams {
  regionCode?: string;
  typeGroup?: string;
  petFriendlyOnly?: boolean;
  nearPoiId?: string;
}

export interface LocationBrowseDetail {
  poiId: string;
  name: string;
  typeCode: string;
  typeGroup: string;
  address: string | null;
  regionCode: string | null;
  petPolicies: PetPolicies;
  coverPhotoUrl: string | null;
  rating: string | null;
  keytag?: string | null;
  businessArea?: string | null;
}

export interface NearbyPetService {
  poiId: string;
  name: string;
  address: string | null;
  distanceMeters: number;
  openingHours: string | null;
}

export interface NearbyPetServices {
  hospital: NearbyPetService | null;
  supplies: NearbyPetService | null;
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
    nearPoiId: params.nearPoiId ?? null,
    page: params.page,
    pageSize: params.pageSize,
  };
}

function locationMapKeyParams(params: Omit<LocationListParams, "page" | "pageSize">) {
  return {
    regionCode: params.regionCode ?? null,
    typeGroup: params.typeGroup ?? null,
    petFriendlyOnly: params.petFriendlyOnly ?? false,
    nearPoiId: params.nearPoiId ?? null,
  };
}

function locationListUrl(params: LocationListParams): string {
  return `/api/locations?${queryString({
    regionCode: params.regionCode,
    typeGroup: params.typeGroup,
    petFriendlyOnly: params.petFriendlyOnly,
    nearPoiId: params.nearPoiId,
    page: params.page,
    pageSize: params.pageSize,
  })}`;
}

export const locationQueryKeys = {
  all: ["locations"] as const,
  types: ["locations", "types"] as const,
  listRoot: ["locations", "list"] as const,
  list: (params: LocationListParams) => ["locations", "list", locationListKeyParams(params)] as const,
  map: (params: Omit<LocationListParams, "page" | "pageSize">) =>
    ["locations", "map", locationMapKeyParams(params)] as const,
  detail: (poiId: string) => ["locations", "detail", poiId] as const,
  nearbyServices: (poiId: string) => ["locations", "nearby-services", poiId] as const,
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
      request<Page<LocationSummary>>(locationListUrl(params), { signal }),
  });
}

export function mapLocationsQueryOptions(
  params: Omit<LocationListParams, "page" | "pageSize">,
) {
  return queryOptions({
    queryKey: locationQueryKeys.map(params),
    queryFn: async ({ signal }) => {
      const pageSize = 100;
      const first = await request<Page<LocationSummary>>(
        locationListUrl({ ...params, page: 1, pageSize }),
        { signal },
      );
      const items = [...first.items];
      for (let page = 2; page <= first.totalPages; page += 1) {
        const next = await request<Page<LocationSummary>>(
          locationListUrl({ ...params, page, pageSize }),
          { signal },
        );
        items.push(...next.items);
      }
      return items;
    },
  });
}

export function locationBrowseDetailQueryOptions(poiId: string) {
  return queryOptions({
    queryKey: locationQueryKeys.detail(poiId),
    queryFn: ({ signal }) =>
      request<LocationBrowseDetail>(`/api/locations/${encodeURIComponent(poiId)}`, { signal }),
  });
}

export function nearbyPetServicesQueryOptions(poiId: string) {
  return queryOptions({
    queryKey: locationQueryKeys.nearbyServices(poiId),
    queryFn: ({ signal }) =>
      request<NearbyPetServices>(
        `/api/locations/${encodeURIComponent(poiId)}/nearby-services`,
        { signal },
      ),
  });
}
