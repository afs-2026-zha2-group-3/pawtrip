import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageFrame({
  above,
  className,
  children,
}: {
  above?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 print:max-w-none print:p-0">
      {above}
      <section
        className={cn(
          "flex flex-col gap-6 rounded-[32px] bg-card p-6 sm:p-8 print:gap-4 print:rounded-none print:bg-transparent print:p-0 print:shadow-none",
          className,
        )}
      >
        {children}
      </section>
    </main>
  );
}
