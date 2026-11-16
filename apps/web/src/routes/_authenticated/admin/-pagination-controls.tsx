import { Button } from "@/components/ui/button";
import type { TablePageMetadata } from "../../../queries/location-pagination";

export function PaginationControls({
  pagination,
  metadata,
  isFetching,
  showTotals = true,
  onPrevious,
  onNext,
}: {
  pagination: { pageIndex: number };
  metadata: TablePageMetadata;
  isFetching: boolean;
  showTotals?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const pageNumber = pagination.pageIndex + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {showTotals
          ? `${metadata.totalIsExact ? "共" : "至少"} ${metadata.rowCount} 条 · 第 ${metadata.pageCount === 0 ? 0 : pageNumber} / ${metadata.pageCount} 页`
          : `第 ${pageNumber} 页`}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!metadata.hasPrevious || isFetching}
        >
          上一页
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!metadata.hasNext || isFetching}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
