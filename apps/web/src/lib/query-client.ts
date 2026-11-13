import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./http/api-error";

export function createQueryClient() {
  let queryClient: QueryClient;

  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.isRetryable && failureCount < 2,
        throwOnError: (error, query) => {
          if (error instanceof ApiError && error.status === 401) {
            return false;
          }
          return query.state.data === undefined;
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error("Query failed", { queryKey: query.queryKey, error });
        if (error instanceof ApiError && error.status === 401 && query.queryKey[0] !== "auth") {
          queryClient.removeQueries({
            predicate: (candidate) => candidate.queryKey[0] !== "auth",
          });
          void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("Mutation failed", error);
      },
    }),
  });

  return queryClient;
}
