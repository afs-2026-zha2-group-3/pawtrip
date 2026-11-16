import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { DestinationCandidate } from "../lib/destination-matching";

export const destinationsQueryOptions = queryOptions({
  queryKey: ["destinations"],
  queryFn: ({ signal }) => request<DestinationCandidate[]>("/api/destinations", { signal }),
});