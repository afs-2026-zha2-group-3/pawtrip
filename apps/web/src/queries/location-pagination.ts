import type { PaginationState } from "@tanstack/react-table";
import type {
  AmapLocationParams,
  Page,
  PaginationParams,
  SavedLocationParams,
} from "./admin-locations";

export const AMAP_MAX_PAGE_SIZE = 25;
export const AMAP_MAX_RESULTS = 200;

export interface TablePageMetadata {
  rowCount: number;
  pageCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalIsExact: boolean;
}

export function initialLocationPagination(): PaginationState {
  return { pageIndex: 0, pageSize: 10 };
}

export function paginationFromApiPage(page: Pick<Page<unknown>, "page" | "pageSize">): PaginationState {
  return { pageIndex: Math.max(0, page.page - 1), pageSize: page.pageSize };
}

export function paginationToApiParams(pagination: PaginationState): PaginationParams {
  if (
    !Number.isInteger(pagination.pageIndex)
    || pagination.pageIndex < 0
    || !Number.isInteger(pagination.pageSize)
    || pagination.pageSize < 1
  ) {
    throw new RangeError("Invalid table pagination state");
  }
  return { page: pagination.pageIndex + 1, pageSize: pagination.pageSize };
}

export function resetPaginationForFilterChange(pagination: PaginationState): PaginationState {
  return { ...pagination, pageIndex: 0 };
}

export function amapParamsFromPagination(
  filters: Pick<AmapLocationParams, "regionCode" | "typeGroup">,
  pagination: PaginationState,
): AmapLocationParams {
  const params = { ...filters, ...paginationToApiParams(pagination) };
  if (!isAmapPageReachable(params)) {
    throw new RangeError("Requested Amap page is outside the 200-result limit");
  }
  return params;
}

export function savedLocationParamsFromPagination(
  filters: Pick<SavedLocationParams, "regionCode" | "typeGroup">,
  pagination: PaginationState,
): SavedLocationParams {
  return { ...filters, ...paginationToApiParams(pagination) };
}

export function isAmapPageReachable(params: PaginationParams): boolean {
  return Number.isInteger(params.page)
    && params.page >= 1
    && Number.isInteger(params.pageSize)
    && params.pageSize >= 1
    && params.pageSize <= AMAP_MAX_PAGE_SIZE
    && (params.page - 1) * params.pageSize < AMAP_MAX_RESULTS;
}

export function amapTablePageMetadata<T>(page: Page<T>): TablePageMetadata {
  const rowCount = Math.max(0, Math.min(page.totalElements, AMAP_MAX_RESULTS));
  const reportedPageCount = Math.ceil(rowCount / page.pageSize);
  const hasReportedNext = page.hasNext && page.page < reportedPageCount;
  const hasInferredNext = !hasReportedNext
    && page.items.length >= page.pageSize
    && page.page * page.pageSize < AMAP_MAX_RESULTS;
  const hasNext = hasReportedNext || hasInferredNext;
  const observedRowCount = (page.page - 1) * page.pageSize + page.items.length;
  const displayRowCount = Math.max(rowCount, observedRowCount);

  return {
    rowCount: displayRowCount,
    pageCount: Math.max(
      Math.ceil(displayRowCount / page.pageSize),
      page.page + Number(hasNext),
    ),
    hasNext,
    hasPrevious: page.hasPrevious && page.page > 1,
    totalIsExact: !hasInferredNext,
  };
}

export function savedLocationTablePageMetadata<T>(page: Page<T>): TablePageMetadata {
  return tablePageMetadata(page);
}

function tablePageMetadata<T>(page: Page<T>, maxRows = Number.MAX_SAFE_INTEGER): TablePageMetadata {
  const rowCount = Math.max(0, Math.min(page.totalElements, maxRows));
  const pageCount = Math.ceil(rowCount / page.pageSize);
  return {
    rowCount,
    pageCount,
    hasNext: page.hasNext && page.page < pageCount,
    hasPrevious: page.hasPrevious && page.page > 1,
    totalIsExact: true,
  };
}
