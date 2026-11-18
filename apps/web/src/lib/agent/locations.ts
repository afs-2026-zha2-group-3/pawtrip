import { queryOptions } from "@tanstack/react-query";
import { request } from "@/lib/http/request";
import type { LocationSummary, Page } from "@/queries/locations";
import {
  AGENT_CATALOG_CANDIDATE_LIMIT,
  AGENT_CATALOG_MAX_PAGES,
  AGENT_CATALOG_PAGE_SIZE,
} from "./constants";

export interface LocationCatalog {
  regionCode: string;
  items: LocationSummary[];
  truncated: boolean;
  totalElements: number;
}

export interface LocationCatalogOptions {
  typeGroup?: string;
  signal?: AbortSignal;
  pageSize?: number;
  maxPages?: number;
  fetchPage?: (page: number, pageSize: number) => Promise<Page<LocationSummary>>;
}

export interface LocationMatchResult {
  candidates: LocationSummary[];
  ambiguous: boolean;
  totalMatched: number;
}

function buildListUrl(regionCode: string, typeGroup: string | undefined, page: number, pageSize: number): string {
  const search = new URLSearchParams({
    regionCode,
    petFriendlyOnly: "false",
    page: String(page),
    pageSize: String(pageSize),
  });
  if (typeGroup) {
    search.set("typeGroup", typeGroup);
  }
  return `/api/locations?${search.toString()}`;
}

export async function fetchLocationCatalog(
  regionCode: string,
  options: LocationCatalogOptions = {},
): Promise<LocationCatalog> {
  const pageSize = options.pageSize ?? AGENT_CATALOG_PAGE_SIZE;
  const maxPages = options.maxPages ?? AGENT_CATALOG_MAX_PAGES;
  const fetchPage =
    options.fetchPage ??
    ((page, size) =>
      request<Page<LocationSummary>>(buildListUrl(regionCode, options.typeGroup, page, size), {
        signal: options.signal,
      }));

  const items: LocationSummary[] = [];
  let truncated = false;
  let totalElements = 0;
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage(page, pageSize);
    items.push(...result.items);
    totalElements = result.totalElements;
    if (!result.hasNext) {
      return { regionCode, items, truncated: false, totalElements };
    }
    if (page === maxPages) {
      truncated = true;
    }
  }
  return { regionCode, items, truncated, totalElements };
}

export function agentLocationCatalogQueryOptions(regionCode: string, typeGroup?: string) {
  return queryOptions({
    queryKey: ["agent", "location-catalog", regionCode, typeGroup ?? null],
    queryFn: ({ signal }) => fetchLocationCatalog(regionCode, { typeGroup, signal }),
    staleTime: 5 * 60_000,
  });
}

/**
 * 判断地点是否属于目标城市：地点 regionCode 可能是区级 adcode（如 440402），
 * 查询城市为市级（440400）；按前四位比较。
 */
export function isSameCity(regionCode: string | null, cityAdcode: string): boolean {
  if (!regionCode) return false;
  return regionCode.slice(0, 4) === cityAdcode.slice(0, 4);
}

/**
 * 本地名称匹配：
 * 1. 名称完全相等优先；多个同名候选标记为 ambiguous。
 * 2. 否则匹配名称、地址或地点标签包含关键词；多个结果标记为 ambiguous，由模型引导用户消歧。
 * 3. 空关键词返回前若干条目录项。
 */
export function matchLocationCatalog(
  items: readonly LocationSummary[],
  query: string,
  limit = AGENT_CATALOG_CANDIDATE_LIMIT,
): LocationMatchResult {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return { candidates: items.slice(0, limit), ambiguous: false, totalMatched: items.length };
  }
  const exact = items.filter((item) => item.name.trim().toLowerCase() === keyword);
  if (exact.length > 0) {
    return {
      candidates: exact.slice(0, limit),
      ambiguous: exact.length > 1,
      totalMatched: exact.length,
    };
  }
  const partial = items.filter((item) => {
    const name = item.name.toLowerCase();
    const address = item.address?.toLowerCase() ?? "";
    const keytag = item.keytag?.toLowerCase() ?? "";
    return name.includes(keyword) || address.includes(keyword) || keytag.includes(keyword);
  });
  return {
    candidates: partial.slice(0, limit),
    ambiguous: partial.length > 1,
    totalMatched: partial.length,
  };
}
