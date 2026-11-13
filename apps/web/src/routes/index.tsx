import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: App });

type Greeting = { message: string };

function App() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/greeting")
      .then((response) => response.json())
      .then((greeting: Greeting) => {
        if (active) {
          setMessage(greeting.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
