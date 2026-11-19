import { useState } from "react";
import { CircleFadingPlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export function DaySelect({
  label,
  totalDays,
  onSelectDay,
  onSelectUnscheduled,
  disabled = false,
  variant = "default",
}: {
  label: string;
  totalDays: number;
  onSelectDay: (day: number) => void;
  onSelectUnscheduled?: () => void;
  disabled?: boolean;
  variant?: "default" | "compact";
}) {
  const compact = variant === "compact";
  // value 保持 null，重复选择同一天仍会触发添加；仅本地记录用于回显最近所选。
  const [picked, setPicked] = useState<number | "unscheduled" | null>(null);
  const compactLabel =
    picked === "unscheduled"
      ? "暂不排期"
      : picked === null
        ? "请选择日期"
        : `第 ${picked} 天`;
  return (
    <Select
      value={null}
      disabled={disabled}
      onValueChange={(value) => {
        if (value === "unscheduled") {
          setPicked("unscheduled");
          onSelectUnscheduled?.();
        } else if (typeof value === "number") {
          setPicked(value);
          onSelectDay(value);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        disabled={disabled}
        title={disabled ? "行程已结束，无法添加地点" : undefined}
        className={cn(
          "rounded-full font-medium [&>svg]:hidden",
          compact
            ? "h-7 border-transparent bg-[#0A0A0A] px-3 text-xs text-white shadow-none data-placeholder:text-white"
            : "h-9 border-[#E5E5E5] bg-card px-3 text-sm shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] data-placeholder:text-foreground",
        )}
      >
        <span className="flex items-center gap-1.5">
          {compact ? compactLabel : label}
          {compact ? (
            <Plus aria-hidden="true" className="size-3.5" />
          ) : (
            <CircleFadingPlus aria-hidden="true" className="size-4 text-muted-foreground" />
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => (
            <SelectItem key={day} value={day}>
              第 {day} 天
            </SelectItem>
          ))}
          {onSelectUnscheduled ? (
            <SelectItem value="unscheduled">暂不排期</SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
