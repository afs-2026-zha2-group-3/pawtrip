import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { DestinationCandidate } from "../lib/destination-matching";

export interface DestinationFilters {
  keyword?: string;
  petFriendly?: boolean;
}

export function destinationsQueryOptions(filters: DestinationFilters = {}) {
  const keyword = filters.keyword?.trim() ?? "";
  const petFriendly = filters.petFriendly ?? false;
  const params = new URLSearchParams();
  if (keyword) {
    params.set("keyword", keyword);
  }
  if (petFriendly) {
    params.set("petFriendly", "true");
  }
  const query = params.toString();
  return queryOptions({
    queryKey: ["destinations", keyword, petFriendly],
    queryFn: ({ signal }) =>
      request<DestinationCandidate[]>(`/api/destinations${query ? `?${query}` : ""}`, { signal }),
  });
}