import * as React from "react";

import { cn } from "@/lib/utils";

function Bubble({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "muted" | "outline" }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      className={cn(
        "max-w-[92%] rounded-xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "muted" && "bg-muted text-foreground",
        variant === "outline" && "border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Bubble };
