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
      <SelectTrigger size="sm" aria-label={label} className="data-[placeholder]:text-foreground">
        {label}
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
