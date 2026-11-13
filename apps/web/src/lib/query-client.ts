import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./http/api-error";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.isRetryable && failureCount < 2,
        throwOnError: (_error, query) => query.state.data === undefined,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error("Query failed", { queryKey: query.queryKey, error });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("Mutation failed", error);
      },
    }),
  });
}
