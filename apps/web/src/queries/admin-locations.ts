import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { isAmapPageReachable } from "./location-pagination";
import { request } from "../lib/http/request";
import {
  locationQueryKeys,
  locationTypesQueryOptions as sharedLocationTypesQueryOptions,
  locationsQueryOptions as sharedLocationsQueryOptions,
  type LocationListParams,
  type LocationSummary,
  type Page,
  type PetPolicies,
  type PaginationParams,
} from "./locations";

export type {
  LocationListParams,
  LocationSummary,
  LocationTypeOption,
  Page,
  PetPolicies,
  PaginationParams,
} from "./locations";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AdministrativeRegion {
  adcode: string;
  name: string;
  level: string;
  children: AdministrativeRegion[];
}


export interface AmapLocationParams extends PaginationParams {
  regionCode?: string;
  typeGroup: string;
}

export interface SavedLocationParams extends PaginationParams {
  regionCode?: string;
  typeGroup?: string;
}

export interface AmapCandidate {
  poiId: string;
  name: string | null;
  typeCode: string | null;
  address: string | null;
  location: string | null;
  regionCode: string | null;
  saved: boolean;
  poi: JsonValue;
}

export type SavedLocation = LocationSummary;

export interface LocationPhoto {
  photoId: number;
  order: number;
  title: string | null;
  sourceUrl: string;
  metadata: JsonValue;
}


export interface LocationDetail {
  poiId: string;
  typeGroup: string;
  minVisitHours: number | null;
  maxVisitHours: number | null;
  petPolicies: PetPolicies;
  poi: JsonValue;
  business: JsonValue;
  photos: LocationPhoto[];
}

export interface SaveLocationInput {
  poiId: string;
  typeGroup: string;
  minVisitHours?: number | null;
  maxVisitHours?: number | null;
  petPolicies?: PetPolicies | null;
}

export interface UpdateLocationInput {
  minVisitHours?: number | null;
  maxVisitHours?: number | null;
  petPolicies?: PetPolicies | null;
}


function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export const adminLocationQueryKeys = {
  all: ["admin", "locations"] as const,
  regions: ["admin", "regions"] as const,
  types: locationQueryKeys.types,
  amapList: (params: AmapLocationParams) =>
    ["admin", "locations", "amap", {
      regionCode: params.regionCode ?? null,
      typeGroup: params.typeGroup,
      page: params.page,
      pageSize: params.pageSize,
    }] as const,
  savedList: (params: SavedLocationParams) =>
    locationQueryKeys.list({ ...params, petFriendlyOnly: false }),
  detail: (poiId: string) => ["admin", "locations", "detail", poiId] as const,
};

export function administrativeRegionsQueryOptions() {
  return queryOptions({
    queryKey: adminLocationQueryKeys.regions,
    queryFn: ({ signal }) => request<AdministrativeRegion[]>("/api/admin/regions", { signal }),
  });
}

export function locationTypesQueryOptions() {
  return sharedLocationTypesQueryOptions();
}

export function amapLocationsQueryOptions(params: AmapLocationParams) {
  return queryOptions({
    queryKey: adminLocationQueryKeys.amapList(params),
    queryFn: ({ signal }) => {
      if (!isAmapPageReachable(params)) {
        throw new RangeError("Requested Amap page is outside the 200-result limit");
      }
      return request<Page<AmapCandidate>>(
        `/api/admin/locations/amap?${queryString({
          regionCode: params.regionCode,
          typeGroup: params.typeGroup,
          page: params.page,
          pageSize: params.pageSize,
        })}`,
        { signal },
      );
    },
  });
}

export function savedLocationsQueryOptions(params: SavedLocationParams) {
  const sharedParams: LocationListParams = { ...params, petFriendlyOnly: false };
  return sharedLocationsQueryOptions(sharedParams);
}

export function locationDetailQueryOptions(poiId: string) {
  return queryOptions({
    queryKey: adminLocationQueryKeys.detail(poiId),
    queryFn: ({ signal }) =>
      request<LocationDetail>(`/api/admin/locations/${encodeURIComponent(poiId)}`, { signal }),
  });
}


export function createLocation(input: SaveLocationInput): Promise<LocationDetail> {
  return request<LocationDetail>("/api/admin/locations", { method: "POST", body: input });
}

export function createLocationMutationOptions() {
  return mutationOptions({
    mutationKey: [...adminLocationQueryKeys.all, "create"],
    mutationFn: createLocation,
  });
}

export function updateLocation(
  poiId: string,
  input: UpdateLocationInput,
): Promise<LocationDetail> {
  return request<LocationDetail>(`/api/admin/locations/${encodeURIComponent(poiId)}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateLocationMutationOptions(poiId: string) {
  return mutationOptions({
    mutationKey: [...adminLocationQueryKeys.all, "update", poiId],
    mutationFn: (input: UpdateLocationInput) => updateLocation(poiId, input),
  });
}


