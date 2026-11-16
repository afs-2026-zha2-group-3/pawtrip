import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  return null;
}
