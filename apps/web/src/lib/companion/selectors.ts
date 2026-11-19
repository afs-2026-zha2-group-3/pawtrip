import { useSelector } from "@tanstack/react-store";
import { companionStore, type CompanionBubble, type CompanionHint } from "./store";

export function useCompanionBubble(): CompanionBubble | null {
  return useSelector(companionStore, (state) => state.bubble);
}

export function useCompanionHintState(): CompanionHint | null {
  return useSelector(companionStore, (state) => state.hint);
}
