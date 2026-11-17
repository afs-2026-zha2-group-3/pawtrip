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
}: {
  label: string;
  totalDays: number;
  onSelectDay: (day: number) => void;
}) {
  return (
    <Select
      value={null}
      onValueChange={(value) => {
        if (typeof value === "number") {
          onSelectDay(value);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
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
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}