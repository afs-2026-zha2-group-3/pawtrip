import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { transportModeOptions } from "@/data/transport-mode-options";
import type { PetSnapshot } from "@/data/transport-rule-match";
import { transportModeLabels, type TransportMode } from "@/data/transport-rules";

const TRIGGER_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function TransportModePicker({
  value,
  pet,
  petState,
  onChange,
  disabled = false,
}: {
  value: TransportMode | null;
  pet: PetSnapshot | null;
  petState: "loading" | "error" | "ready";
  onChange: (mode: TransportMode) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = transportModeOptions(pet);
  const petNote = pet
    ? `按 ${pet.name} 的档案判定`
    : petState === "loading"
      ? "正在读取宠物档案…"
      : petState === "error"
        ? "暂时无法读取宠物档案，请稍后重试。"
        : "暂无宠物档案，仅可选择方式";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        title={disabled ? "行程已结束，无法修改大交通" : undefined}
        aria-label={
          value
            ? `大交通方式：${transportModeLabels[value]}`
            : "选择大交通方式"
        }
        data-testid={value ? "transport-mode-tag" : "transport-mode-picker"}
        className={cn(
          TRIGGER_CLASS,
          value
            ? "bg-muted text-muted-foreground hover:text-foreground"
            : "border border-dashed border-border text-muted-foreground hover:border-solid hover:text-foreground",
        )}
      >
        {value ? `大交通 · ${transportModeLabels[value]}` : "选择大交通"}
        <ChevronDown aria-hidden="true" className="size-3" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        <div className="flex items-start justify-between gap-2 px-1.5 pb-1">
          <div>
            <p className="text-sm font-medium">选择大交通方式</p>
            <p className="text-xs text-muted-foreground">{petNote}</p>
          </div>
          <Link
            to="/transport-rules"
            aria-label="查看交通规则详情"
            onClick={() => setOpen(false)}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            规则详情
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          {options.map((option) => (
            <button
              key={option.mode}
              type="button"
              data-mode={option.mode}
              aria-pressed={value === option.mode}
              onClick={() => {
                onChange(option.mode);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col gap-0.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                value === option.mode && "bg-muted",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.carrierName ? (
                    <span className="text-xs text-muted-foreground">
                      按{option.carrierName}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-1">
                  {option.verdict ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        option.verdict.recommended
                          ? "text-primary"
                          : "text-destructive",
                      )}
                    >
                      {pet?.name} ·{" "}
                      {option.verdict.recommended ? "推荐" : "不推荐"}
                    </span>
                  ) : null}
                  {value === option.mode ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : null}
                </span>
              </span>
              {option.verdict && !option.verdict.recommended ? (
                <span className="text-xs text-muted-foreground">
                  {option.verdict.reasons.join("；")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
