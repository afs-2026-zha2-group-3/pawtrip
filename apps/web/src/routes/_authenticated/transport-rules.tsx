import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  PET_PROFILE_PATH,
  allowanceStatusLabels,
  getFlightRules,
  getRulesByMode,
  transportFormLabels,
  transportModeLabels,
  transportRuleRowModes,
  type AllowanceStatus,
  type TransportMode,
  type TransportRule,
} from "../../data/transport-rules";

export const Route = createFileRoute("/_authenticated/transport-rules")({
  component: TransportRulesPage,
});

interface TransportRuleColumn {
  key: string;
  label: string;
  className?: string;
  render: (rule: TransportRule) => ReactNode;
}

const allowanceStatusClasses: Record<AllowanceStatus, string> = {
  allowed: "bg-primary/10 text-primary",
  conditional: "bg-secondary text-secondary-foreground",
  not_allowed: "bg-muted text-muted-foreground",
};

function TransportRulesPage() {
  const flightRules = getFlightRules();
  const [carrierCode, setCarrierCode] = useState<string>(
    flightRules[0]?.carrierCode ?? "",
  );

  const selectedFlightRule =
    flightRules.find((rule) => rule.carrierCode === carrierCode) ?? null;

  const rowRules = transportRuleRowModes
    .map((mode) => ({
      mode,
      rule:
        mode === "flight"
          ? selectedFlightRule
          : (getRulesByMode(mode)[0] ?? null),
    }))
    .filter(
      (row): row is { mode: TransportMode; rule: TransportRule } =>
        row.rule !== null,
    );

  const allRules = transportRuleRowModes.flatMap((mode) =>
    getRulesByMode(mode),
  );
  const reviewedCount = allRules.filter((rule) => rule.verifiedOn).length;
  const sources = allRules.filter(
    (rule, index) =>
      allRules.findIndex((item) => item.sourceUrl === rule.sourceUrl) === index,
  );

  // 列配置：基础列固定在前，扩展列按需追加（取值来自规则 extra），表格结构无需改动。
  const transportRuleColumns: TransportRuleColumn[] = [
    {
      key: "mode",
      label: "方式",
      render: (rule) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{transportModeLabels[rule.mode]}</span>
          {rule.mode === "flight" ? (
            <Select
              value={carrierCode}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setCarrierCode(value);
                }
              }}
            >
              <SelectTrigger size="sm" aria-label="选择航司">
                <SelectValue>
                  {(value: string | null) =>
                    flightRules.find((item) => item.carrierCode === value)
                      ?.carrierName ?? "选择航司"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {flightRules.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.carrierCode ?? item.id}
                    >
                      {item.carrierName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">
              {transportFormLabels[rule.transportForm]}
            </span>
          )}
          {rule.mode === "flight" ? (
            <span className="text-xs text-muted-foreground">
              以航司最新规则为准
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {rule.verifiedOn ? `已复核 ${rule.verifiedOn}` : "待复核"}
          </span>
        </div>
      ),
    },
    {
      key: "allowance",
      label: "能否携带",
      className: "min-w-48",
      render: (rule) => (
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium",
              allowanceStatusClasses[rule.allowanceStatus],
            )}
          >
            {allowanceStatusLabels[rule.allowanceStatus]}
          </span>
          <span>{rule.allowedSummary}</span>
          {rule.allowanceNote ? (
            <span className="text-xs text-muted-foreground">
              {rule.allowanceNote}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "weight",
      label: "体重上限",
      className: "min-w-40",
      render: (rule) => (
        <div className="flex flex-col gap-1">
          <span>
            {rule.weightLimitKg === null
              ? "无统一限制"
              : `≤${rule.weightLimitKg} kg`}
          </span>
          <span className="text-xs text-muted-foreground">
            {rule.weightLimitNote}
          </span>
        </div>
      ),
    },
    {
      key: "container",
      label: "容器要求",
      className: "min-w-56",
      render: (rule) => rule.containerRequirement,
    },
    {
      key: "procedure",
      label: "办理流程概要",
      className: "min-w-64",
      render: (rule) => rule.procedureSummary,
    },
    {
      key: "quarantine",
      label: "检疫证明",
      className: "min-w-48",
      render: (rule) => rule.extra.quarantineRequirement ?? "—",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            交通携宠规则对比
          </CardTitle>
          <CardDescription>
            四种交通方式的携宠规则一览；规则为人工摘录，发布前复核。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table aria-label="交通携宠规则对比">
            <TableHeader>
              <TableRow>
                {transportRuleColumns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowRules.map(({ mode, rule }) => (
                <TableRow key={mode}>
                  {transportRuleColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn("whitespace-normal align-top", column.className)}
                    >
                      {column.render(rule)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <section
            aria-label="规则说明"
            className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground"
          >
            <p>
              数据来源：规则内容人工摘录自
              {sources.map((rule, index) => (
                <span key={rule.sourceUrl}>
                  {index > 0 ? "、" : ""}
                  <a
                    href={rule.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {rule.sourceTitle}
                  </a>
                </span>
              ))}
            </p>
            <p>
              人工复核：共 {allRules.length} 条规则，已复核 {reviewedCount} 条，
              待复核 {allRules.length - reviewedCount} 条；待复核条目不得发布，合并前须补齐复核日期。
            </p>
            <p>
              免责声明：规则可能随政策调整而滞后，请以承运方最新规则为准（飞机以航司最新规则为准，
              铁路以 12306 或中铁快运最新公告为准）。
            </p>
            <p>PawTrip 不提供站内订票，请通过官方或第三方渠道预订。</p>
          </section>

          <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-sm">
              还没有宠物档案？录入后可查看按宠物情况整理的提示。
            </p>
            <a
              href={PET_PROFILE_PATH}
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              录入宠物档案
            </a>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
