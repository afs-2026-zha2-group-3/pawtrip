import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { isAmapPageReachable } from "./location-pagination";
import { request } from "../lib/http/request";

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

export interface LocationTypeOption {
  key: string;
  label: string;
  typeCodes: string[];
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

export interface PaginationParams {
  page: number;
  pageSize: number;
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

export interface SavedLocation {
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
}

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
  poi: JsonValue;
  business: JsonValue;
  photos: LocationPhoto[];
}

export interface SaveLocationInput {
  poiId: string;
  typeGroup: string;
  minVisitHours?: number | null;
  maxVisitHours?: number | null;
}

export interface UpdateLocationInput {
  minVisitHours?: number | null;
  maxVisitHours?: number | null;
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

function locationListKeyParams(params: SavedLocationParams) {
  return {
    regionCode: params.regionCode ?? null,
    typeGroup: params.typeGroup ?? null,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export const adminLocationQueryKeys = {
  all: ["admin", "locations"] as const,
  regions: ["admin", "regions"] as const,
  types: ["admin", "location-types"] as const,
  amapList: (params: AmapLocationParams) =>
    ["admin", "locations", "amap", locationListKeyParams(params)] as const,
  savedList: (params: SavedLocationParams) =>
    ["admin", "locations", "saved", locationListKeyParams(params)] as const,
  detail: (poiId: string) => ["admin", "locations", "detail", poiId] as const,
};

export function administrativeRegionsQueryOptions() {
  return queryOptions({
    queryKey: adminLocationQueryKeys.regions,
    queryFn: ({ signal }) => request<AdministrativeRegion[]>("/api/admin/regions", { signal }),
  });
}

export function locationTypesQueryOptions() {
  return queryOptions({
    queryKey: adminLocationQueryKeys.types,
    queryFn: ({ signal }) => request<LocationTypeOption[]>("/api/admin/location-types", { signal }),
  });
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
  return queryOptions({
    queryKey: adminLocationQueryKeys.savedList(params),
    queryFn: ({ signal }) =>
      request<Page<SavedLocation>>(
        `/api/admin/locations?${queryString({
          regionCode: params.regionCode,
          typeGroup: params.typeGroup,
          page: params.page,
          pageSize: params.pageSize,
        })}`,
        { signal },
      ),
  });
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


