import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCompanionBubble, useCompanionHintState } from "@/lib/companion/selectors";
import { companionActions, type CompanionMood } from "@/lib/companion/store";
import { cn } from "@/lib/utils";

export const COMPANION_BUBBLE_MS = 5000;

const MOOD_BORDER: Record<CompanionMood, string> = {
  ok: "border-emerald-300",
  info: "border-[#EC9455]",
  warn: "border-amber-400",
  danger: "border-red-400",
};

const MOOD_DOT: Record<CompanionMood, string> = {
  ok: "bg-emerald-500",
  info: "bg-[#EC9455]",
  warn: "bg-amber-500",
  danger: "bg-red-500",
};

export function CompanionBubble({
  pathname,
  name,
  panelOpen = false,
}: {
  pathname: string;
  name: string;
  panelOpen?: boolean;
}) {
  const hint = useCompanionHintState();
  const bubble = useCompanionBubble();
  const autoShownPath = useRef(pathname);
  const hidden = pathname.startsWith("/admin") || panelOpen;

  // 打开 AI 面板时直接关闭气泡，避免气泡浮在面板上方；关闭面板后不重新弹出。
  useEffect(() => {
    if (!panelOpen || !bubble) return;
    companionActions.dismiss(bubble.id);
  }, [bubble, panelOpen]);

  useEffect(() => {
    if (hidden || !hint || hint.path !== pathname) return;
    if (autoShownPath.current === pathname) return;
    // 跨页事件反馈尚未过期时优先展示，事件关闭后同一页面再补情境提示。
    if (
      bubble?.kind === "event" &&
      Date.now() - bubble.createdAt < COMPANION_BUBBLE_MS
    ) {
      return;
    }
    autoShownPath.current = pathname;
    companionActions.showHint();
  }, [bubble, hidden, hint, pathname]);

  useEffect(() => {
    if (!bubble) return;
    const remaining = Math.max(
      0,
      COMPANION_BUBBLE_MS - (Date.now() - bubble.createdAt),
    );
    const timer = window.setTimeout(
      () => companionActions.dismiss(bubble.id),
      remaining,
    );
    return () => window.clearTimeout(timer);
  }, [bubble]);

  if (hidden || !bubble) {
    return null;
  }

  return (
    <div
      data-testid="companion-bubble"
      data-mood={bubble.mood}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto absolute right-0 bottom-full mb-3 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 rounded-2xl border-2 bg-card p-3 shadow-xl print:hidden",
        MOOD_BORDER[bubble.mood],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", MOOD_DOT[bubble.mood])}
          />
          {name} · 伙伴提示
        </p>
        <button
          type="button"
          aria-label="关闭伙伴提示"
          className="-mt-1 -mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => companionActions.dismiss(bubble.id)}
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <p className="text-sm leading-5 text-foreground">{bubble.text}</p>
    </div>
  );
}
