import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { greetingQueryOptions } from "../../queries/greeting";

export const Route = createFileRoute("/_authenticated/")({ component: App });

function App() {
  const { data } = useQuery(greetingQueryOptions);
  const message = data?.message ?? "";

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">PawTrip</p>
        <h1 className="display-title mb-5 text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          {message}
        </h1>
      </section>
    </main>
  );
}
