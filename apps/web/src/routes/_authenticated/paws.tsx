import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/paws")({
  component: PawsPage,
});

function PawsPage() {
  return null;
}
