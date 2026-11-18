import * as React from "react";

import { cn } from "@/lib/utils";

function MessageScroller({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const pinned = React.useRef(true);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !pinned.current) return;
    element.scrollTop = element.scrollHeight;
  });

  return (
    <div
      ref={ref}
      data-slot="message-scroller"
      className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1", className)}
      onScroll={(event) => {
        const element = event.currentTarget;
        pinned.current =
          element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { MessageScroller };
