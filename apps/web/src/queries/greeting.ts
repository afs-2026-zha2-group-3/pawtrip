import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type Greeting = { message: string };

export const greetingQueryOptions = queryOptions({
  queryKey: ["greeting"],
  queryFn: ({ signal }) => request<Greeting>("/api/greeting", { signal }),
});
