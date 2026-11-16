import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
import { useActiveTrip, usePolicySubjects } from "../../lib/trip/selectors";
import { evaluateRuleForPet } from "../../data/transport-rule-match";
import {
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

/** 临时缓存键：选中的交通方式，供后续生成行程单读取 */
const SELECTED_MODE_STORAGE_KEY = "pawtrip:selected-transport-mode";

function readSelectedMode(): TransportMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SELECTED_MODE_STORAGE_KEY);
    return transportRuleRowModes.find((mode) => mode === stored) ?? null;
  } catch {
    return null;
  }
}

function persistSelectedMode(mode: TransportMode) {
  try {
    window.sessionStorage.setItem(SELECTED_MODE_STORAGE_KEY, mode);
  } catch {
    // 缓存不可用（如隐私模式）时静默降级：页面仍可单选，只是不持久
  }
}

function TransportRulesPage() {
  const flightRules = getFlightRules();
  const [carrierCode, setCarrierCode] = useState<string>(
    flightRules[0]?.carrierCode ?? "",
  );
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const active = useActiveTrip();
  const subjects = usePolicySubjects();
  const pets = subjects.subjects;
  const showRecommendation = subjects.status === "ready" && pets.length > 0;

  // 在挂载后读取缓存，避免服务端渲染与客户端首帧不一致
  useEffect(() => {
    setSelectedMode(readSelectedMode());
  }, []);

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
      key: "selection",
      label: "选择",
      className: "w-12",
      render: (rule) => (
        <label className="flex cursor-pointer items-center">
          <input
            type="radio"
            name="transport-mode"
            className="size-4 accent-primary"
            aria-label={`选择${transportModeLabels[rule.mode]}`}
            checked={selectedMode === rule.mode}
            onChange={() => {
              setSelectedMode(rule.mode);
              persistSelectedMode(rule.mode);
            }}
          />
        </label>
      ),
    },
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
    ...(showRecommendation
      ? [
          {
            key: "recommendation",
            label: "是否推荐",
            className: "min-w-48",
            render: (rule: TransportRule) => (
              <ul
                aria-label={`${transportModeLabels[rule.mode]}是否推荐`}
                className="flex flex-col gap-1"
              >
                {pets.map((pet) => {
                  const verdict = evaluateRuleForPet(rule, pet);
                  return (
                    <li key={pet.id} className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !verdict.recommended && "text-destructive",
                        )}
                      >
                        {pet.name} · {verdict.recommended ? "推荐" : "不推荐"}
                      </span>
                      {verdict.reasons.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {verdict.reasons.join("；")}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ),
          } satisfies TransportRuleColumn,
        ]
      : []),
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
              人工复核：共 {allRules.length} 条规则，
              {reviewedCount === allRules.length
                ? "已全部复核。"
                : `已复核 ${reviewedCount} 条，待复核 ${allRules.length - reviewedCount} 条；待复核条目不得发布，合并前须补齐复核日期。`}
            </p>
            <p>
              免责声明：规则可能随政策调整而滞后，请以承运方最新规则为准（飞机以航司最新规则为准，
              铁路以 12306 或中铁快运最新公告为准）。
            </p>
            <p>PawTrip 不提供站内订票，请通过官方或第三方渠道预订。</p>
          </section>

          {subjects.status === "error" ? (
            <section className="rounded-lg border border-border p-3">
              <p className="text-sm text-destructive">
                宠物档案加载失败，请刷新重试。
              </p>
            </section>
          ) : null}

          {subjects.status === "loading" && active ? (
            <section className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">
                正在读取激活行程绑定的宠物档案…
              </p>
            </section>
          ) : null}

          {subjects.status === "none" ? (
            <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-sm">还没有宠物档案，暂时无法给出推荐。</p>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => void navigate({ to: "/paws" })}
              >
                新增宠物档案
              </Button>
            </section>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
