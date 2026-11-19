import { useEffect } from "react";
import { companionActions } from "./store";

export function useCompanionHint(text: string | null, path: string): void {
  const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;

  useEffect(() => {
    if (!text) return;
    companionActions.setHint(text, normalized);
    return () => companionActions.clearHint(normalized);
  }, [normalized, text]);
}
