import { useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import transportDriveImage from "@/assets/transport-rules/transport-drive.png";
import transportFlightImage from "@/assets/transport-rules/transport-flight.png";
import transportRailImage from "@/assets/transport-rules/transport-rail.png";
import transportTrainImage from "@/assets/transport-rules/transport-train.png";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
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
  useActiveTrip,
  useHydrationStatus,
  usePolicySubjects,
} from "../../lib/trip/selectors";
import { tripActions } from "../../lib/trip/store";
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

const transportModeImages: Record<TransportMode, string> = {
  flight: transportFlightImage,
  high_speed_rail: transportRailImage,
  train: transportTrainImage,
  drive: transportDriveImage,
};

const allowanceStatusClasses: Record<AllowanceStatus, string> = {
  allowed: "bg-[#FFEFD6] text-[#F76B15]",
  conditional: "bg-[#FFEFD6] text-[#F76B15]",
  not_allowed: "bg-[#F0F0F0] text-[#838383]",
};

const chipClass =
  "inline-flex h-[21px] w-fit items-center rounded-md px-1.5 text-xs font-medium";
const figureClass = "text-[18px] font-medium leading-[21.6px] text-[#262626]";
const panelClass =
  "rounded-[22px] border-2 border-[#EC9455] bg-card p-6 shadow-md";

function TransportRulesPage() {
  const isClient = typeof window !== "undefined";
  const flightRules = getFlightRules();
  const [carrierCode, setCarrierCode] = useState<string>(
    flightRules[0]?.carrierCode ?? "",
  );
  const navigate = useNavigate();
  const active = useActiveTrip();
  const hydration = useHydrationStatus();
  const subjects = usePolicySubjects();
  const pets = subjects.subjects;
  const showRecommendation = subjects.status === "ready" && pets.length > 0;

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

  const driveRule = getRulesByMode("drive")[0] ?? null;
  const driveRecommended =
    showRecommendation &&
    driveRule !== null &&
    pets.every((pet) => evaluateRuleForPet(driveRule, pet).recommended);

  // 列配置：基础列固定在前，扩展列按需追加（取值来自规则 extra），表格结构无需改动。
  const transportRuleColumns: TransportRuleColumn[] = [
    {
      key: "selection",
      label: "选择",
      className: "w-12",
      render: (rule) => (
        <label className="flex cursor-pointer items-center pt-1">
          <input
            type="radio"
            name="transport-mode"
            className="size-4 accent-[#EC9455]"
            aria-label={`选择${transportModeLabels[rule.mode]}`}
            checked={active?.transportMode === rule.mode}
            onChange={() => tripActions.setTransportMode(rule.mode)}
          />
        </label>
      ),
    },
    {
      key: "mode",
      label: "方式",
      render: (rule) => (
        <div className="flex flex-col gap-2">
          <img
            src={transportModeImages[rule.mode]}
            alt=""
            aria-hidden="true"
            className="h-[50px] w-[117px] rounded-[14px] object-cover"
          />
          <span className={figureClass}>{transportModeLabels[rule.mode]}</span>
          {rule.mode === "flight" ? (
            <Select
              value={carrierCode}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setCarrierCode(value);
                }
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="选择航司"
                className="h-8 rounded-full border-[#E5E5E5] bg-card px-3 text-sm text-foreground"
              >
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
            className: "min-w-40",
            render: (rule: TransportRule) => (
              <ul
                aria-label={`${transportModeLabels[rule.mode]}是否推荐`}
                className="flex flex-col gap-1.5"
              >
                {pets.map((pet) => {
                  const verdict = evaluateRuleForPet(rule, pet);
                  return (
                    <li key={pet.id} className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "w-fit text-sm font-medium",
                          verdict.recommended
                            ? cn(chipClass, "bg-[#FFEFD6] text-[#F76B15]")
                            : "text-destructive",
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
      className: "min-w-44",
      render: (rule) => (
        <div className="flex flex-col gap-1.5">
          <span
            className={cn(
              chipClass,
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
      className: "min-w-32",
      render: (rule) => (
        <div className="flex flex-col gap-1.5">
          <span className={figureClass}>
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
      className: "min-w-48",
      render: (rule) => rule.containerRequirement,
    },
    {
      key: "procedure",
      label: "办理流程概要",
      className: "min-w-52",
      render: (rule) => rule.procedureSummary,
    },
    {
      key: "quarantine",
      label: "检疫证明",
      className: "min-w-40",
      render: (rule) => rule.extra.quarantineRequirement ?? "—",
    },
  ];

  if (!isClient) {
    return null;
  }

  if (!active && hydration !== "ready" && hydration !== "missing") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className={panelClass}>
          <p className="text-sm text-muted-foreground">正在恢复激活行程…</p>
        </div>
      </main>
    );
  }

  if (!active) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className={panelClass}>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>先创建或激活行程</EmptyTitle>
              <EmptyDescription>
                交通规则选择需要关联激活行程；请先在「城市浏览」创建行程或在「我的行程」激活已有行程。
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                className="rounded-full"
                onClick={() => void navigate({ to: "/cities" })}
              >
                去创建行程
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => void navigate({ to: "/trips" })}
              >
                查看我的行程
              </Button>
            </div>
          </Empty>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1662px] px-4 py-6 sm:px-6">
      <div className={cn(panelClass, "flex flex-col gap-6")}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium leading-8 text-foreground">
            交通选择
          </h1>
          <p className="text-sm text-muted-foreground">
            四种交通方式的携宠规则一览；规则为人工摘录，发布前复核。
          </p>
        </div>

        {showRecommendation ? (
          <section
            aria-label="基于宠物档案的推荐"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#FFEFD6] px-6 py-3"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] font-medium leading-[26.4px] tracking-[-0.0227em] text-[#262626]">
                根据当前宠物档案：
                {pets.map((pet) => `${pet.name} · ${pet.weightKg} kg`).join("、")}
              </h2>
              <p className="text-sm text-[#6B6875]">
                已根据宠物体重和携宠规则，为你整理适合的交通方式。
              </p>
            </div>
            {driveRecommended ? (
              <span className={cn(chipClass, "bg-card text-[#F76B15]")}>
                优先推荐自驾
              </span>
            ) : null}
          </section>
        ) : null}

        <Table aria-label="交通携宠规则对比">
          <TableHeader>
            <TableRow className="border-b border-[#E8E8E8] hover:bg-transparent">
              {transportRuleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className="h-10 px-2 text-xs font-normal text-muted-foreground"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowRules.map(({ mode, rule }) => (
              <TableRow
                key={mode}
                className="border-b border-[#E8E8E8] hover:bg-[#FFEFD6]/40"
              >
                {transportRuleColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "whitespace-normal align-top px-2 py-4",
                      column.className,
                    )}
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
          className="flex flex-col gap-2 rounded-[14px] bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground"
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
                  className="text-[#0588F0] underline underline-offset-2 hover:text-[#0588F0]/80"
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
          <section className="rounded-[14px] border border-[#E0E0E0] p-4">
            <p className="text-sm text-destructive">
              宠物档案加载失败，请刷新重试。
            </p>
          </section>
        ) : null}

        {subjects.status === "loading" && active ? (
          <section className="rounded-[14px] border border-[#E0E0E0] p-4">
            <p className="text-sm text-muted-foreground">
              正在读取激活行程绑定的宠物档案…
            </p>
          </section>
        ) : null}

        {subjects.status === "none" ? (
          <section className="flex flex-col gap-2 rounded-[14px] bg-[#FFEFD6] p-4">
            <p className="text-sm text-[#262626]">
              还没有宠物档案，暂时无法给出推荐。
            </p>
            <Button
              variant="outline"
              className="w-fit rounded-full border-[#E5E5E5] bg-card"
              onClick={() => void navigate({ to: "/paws" })}
            >
              新增宠物档案
            </Button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
