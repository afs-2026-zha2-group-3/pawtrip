import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { diffPlans } from "@/lib/agent/proposal";
import type { AgentProposal } from "@/lib/agent/types";
import type { Trip } from "@/lib/trip/types";

export function ProposalCard({
  proposal,
  targetTrip,
  names,
  applying,
  error,
  onApply,
  onReject,
}: {
  proposal: AgentProposal;
  targetTrip: Trip | null;
  names: Record<string, string>;
  applying: boolean;
  error: string | null;
  onApply: () => void;
  onReject: () => void;
}) {
  const diff = useMemo(
    () =>
      targetTrip
        ? diffPlans(targetTrip.plan, proposal.plan, targetTrip.totalDays)
        : null,
    [proposal.plan, targetTrip],
  );
  const nameOf = (poiId: string) => names[poiId] ?? poiId;
  const actionable = proposal.status === "pending" && !applying;

  return (
    <Card
      data-testid="agent-proposal"
      className="max-h-[50%] min-h-0 gap-3 border-primary/30"
    >
      <CardHeader className="shrink-0 gap-1">
        <CardTitle className="text-sm">待确认方案</CardTitle>
        <p className="text-xs text-muted-foreground">{proposal.summary}</p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1 text-xs">
        {diff?.days.map((day) =>
          day.added.length || day.removed.length ? (
            <div key={day.day} className="flex flex-col gap-0.5">
              <span className="font-medium">第 {day.day} 天</span>
              {day.added.length > 0 ? (
                <span className="text-emerald-700">
                  新增：{day.added.map(nameOf).join("、")}
                </span>
              ) : null}
              {day.removed.length > 0 ? (
                <span className="text-destructive">
                  移除：{day.removed.map(nameOf).join("、")}
                </span>
              ) : null}
            </div>
          ) : null,
        )}
        {diff && diff.unscheduledAdded.length > 0 ? (
          <span className="text-emerald-700">
            加入未排期：{diff.unscheduledAdded.map(nameOf).join("、")}
          </span>
        ) : null}
        {diff && diff.unscheduledRemoved.length > 0 ? (
          <span className="text-destructive">
            移出未排期：{diff.unscheduledRemoved.map(nameOf).join("、")}
          </span>
        ) : null}
        {proposal.warnings.length > 0 ? (
          <div className="flex flex-col gap-0.5 text-amber-700">
            {proposal.warnings.map((warning) => (
              <span key={warning}>注意：{warning}</span>
            ))}
          </div>
        ) : null}
        {error ? (
          <p className="text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="shrink-0 gap-2">
        <Button size="sm" disabled={!actionable} onClick={onApply}>
          {applying ? "应用中…" : "确认应用"}
        </Button>
        <Button size="sm" variant="outline" disabled={!actionable} onClick={onReject}>
          拒绝
        </Button>
      </CardFooter>
    </Card>
  );
}
