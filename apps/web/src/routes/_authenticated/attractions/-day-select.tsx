import { CircleFadingPlus } from "lucide-react";
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
}: {
  label: string;
  totalDays: number;
  onSelectDay: (day: number) => void;
  onSelectUnscheduled?: () => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={null}
      disabled={disabled}
      onValueChange={(value) => {
        if (value === "unscheduled") {
          onSelectUnscheduled?.();
        } else if (typeof value === "number") {
          onSelectDay(value);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        disabled={disabled}
        title={disabled ? "行程已结束，无法添加地点" : undefined}
        className="h-9 rounded-full border-[#E5E5E5] bg-card px-3 text-sm font-medium shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] data-placeholder:text-foreground [&>svg]:hidden"
      >
        <span className="flex items-center gap-1.5">
          {label}
          <CircleFadingPlus aria-hidden="true" className="size-4 text-muted-foreground" />
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
