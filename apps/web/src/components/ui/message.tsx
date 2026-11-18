import * as React from "react";

import { cn } from "@/lib/utils";

function Message({
  className,
  from,
  ...props
}: React.ComponentProps<"div"> & { from: "user" | "assistant" | "system" }) {
  return (
    <div
      data-slot="message"
      data-from={from}
      className={cn(
        "flex w-full flex-col gap-1",
        from === "user" ? "items-end" : "items-start",
        className,
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  );
}

export { Message, MessageContent };
