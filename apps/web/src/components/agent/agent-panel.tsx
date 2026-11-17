import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { MessageScroller } from "@/components/ui/message-scroller";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bubble } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { ProposalCard } from "@/components/agent/proposal-card";
import { CityTripDialog } from "@/routes/_authenticated/-city-trip-dialog";
import { applyProposal } from "@/lib/agent/apply";
import { createAgentClientTools } from "@/lib/agent/client-tools";
import { buildAgentContext } from "@/lib/agent/context";
import { agentActions } from "@/lib/agent/store";
import {
  useAgentLocationNames,
  useAgentNewTripFlow,
  useAgentOpen,
  useAgentProposals,
  useAgentTarget,
  useAgentTargetTrip,
  usePendingProposal,
} from "@/lib/agent/selectors";
import { destinationsQueryOptions } from "@/queries/destinations";
import { locationBrowseDetailQueryOptions } from "@/queries/locations";
import { petsQueryOptions } from "@/queries/pets";
import {
  fetchTripDetail,
  tripDetailQueryOptions,
  tripQueryKeys,
  tripsQueryOptions,
  updateTrip,
} from "@/queries/trips";
import { flushTripSave } from "@/lib/trip/save";
import { tripActions, tripStore } from "@/lib/trip/store";
import { useActiveTrip } from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";

interface RenderedPart {
  type: string;
  content?: string;
  name?: string;
  state?: string;
  output?: unknown;
  errorText?: string;
}

interface RenderedMessage {
  id: string;
  role: string;
  parts: RenderedPart[];
}

export function AgentPanel() {
  const open = useAgentOpen();
  const target = useAgentTarget();
  const targetTrip = useAgentTargetTrip();
  const active = useActiveTrip();
  const flow = useAgentNewTripFlow();
  const pending = usePendingProposal();
  const proposals = useAgentProposals();
  const shownProposal = proposals.length > 0 ? proposals[proposals.length - 1] : null;
  const names = useAgentLocationNames();
  const queryClient = useQueryClient();
  const isClient = typeof window !== "undefined";

  const trips = useQuery({
    ...tripsQueryOptions(),
    enabled: isClient && open,
    throwOnError: false,
  });
  const destinations = useQuery({
    ...destinationsQueryOptions({}),
    enabled: isClient && open,
    throwOnError: false,
  });
  const pets = useQuery({
    ...petsQueryOptions(),
    enabled: isClient && open,
    throwOnError: false,
  });
  const targetTripId = target?.kind === "existing" ? target.tripId : 0;
  const detail = useQuery({
    ...tripDetailQueryOptions(targetTripId),
    enabled: open && target?.kind === "existing" && targetTrip?.id !== targetTripId,
    throwOnError: false,
  });

  const [threadId] = useState(() => `trip-planning-${crypto.randomUUID()}`);
  const tools = useMemo(() => createAgentClientTools(queryClient), [queryClient]);
  const chat = useChat({
    connection: fetchServerSentEvents("/agent"),
    threadId,
    tools,
  });
  const [input, setInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (detail.data) {
      agentActions.setTargetTrip(detail.data);
    }
  }, [detail.data]);

  useEffect(() => {
    if (target?.kind === "existing" && active?.id === target.tripId) {
      agentActions.setTargetTrip(active);
    }
  }, [active, target]);

  useEffect(() => {
    if (!target && active) {
      agentActions.setTarget({ kind: "existing", tripId: active.id }, active);
    }
  }, [active, target]);

  useEffect(() => {
    setApplyError(null);
  }, [shownProposal?.id]);

  const city = useMemo(() => {
    const adcode = targetTrip?.cityAdcode;
    if (!adcode) return null;
    const candidate = (destinations.data ?? []).find((item) => item.adcode === adcode);
    return candidate
      ? { adcode: candidate.adcode, name: candidate.name, province: candidate.province }
      : { adcode, name: adcode, province: "" };
  }, [destinations.data, targetTrip?.cityAdcode]);

  const agentContext = useMemo(
    () =>
      buildAgentContext({
        target,
        targetTrip,
        activeTripId: active?.id ?? null,
        pets: pets.data ?? [],
        city,
      }),
    [active?.id, city, pets.data, target, targetTrip],
  );

  const messages = chat.messages as unknown as ReadonlyArray<RenderedMessage>;

  async function send() {
    const text = input.trim();
    if (!text || chat.isLoading) return;
    setInput("");
    setApplyError(null);
    agentActions.resetAllowedPoiIds();
    await chat.sendMessage(text, { body: { agentContext } });
  }

  async function apply() {
    if (!pending || !targetTrip) return;
    setApplying(true);
    setApplyError(null);
    const result = await applyProposal(pending, {
      activeTripId: active?.id ?? null,
      fetchTrip: fetchTripDetail,
      flushSave: flushTripSave,
      replaceActivePlan: tripActions.replaceActivePlan,
      updateInactive: updateTrip,
      verifyPoiId: async (poiId) => {
        try {
          await queryClient.fetchQuery(locationBrowseDetailQueryOptions(poiId));
          return true;
        } catch {
          return false;
        }
      },
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
        const fresh = await queryClient.fetchQuery(tripDetailQueryOptions(pending.tripId));
        agentActions.setTargetTrip(fresh);
      },
    });
    setApplying(false);
    if (result.ok) {
      agentActions.setProposalStatus(pending.id, "applied");
    } else {
      agentActions.setProposalStatus(pending.id, "error", result.message);
      setApplyError(result.message);
    }
  }

  function selectTarget(value: string) {
    if (value === "new") {
      agentActions.setTarget({
        kind: "new",
        city: null,
        startDate: null,
        endDate: null,
        petId: null,
      });
      return;
    }
    const tripId = Number(value.replace("existing:", ""));
    if (!Number.isSafeInteger(tripId) || tripId <= 0) return;
    agentActions.setTarget({ kind: "existing", tripId }, active?.id === tripId ? active : null);
  }

  const targetValue =
    target?.kind === "new"
      ? "new"
      : target?.kind === "existing"
        ? `existing:${target.tripId}`
        : "";

  async function confirmDeactivation() {
    if (!flow) return;
    const outcome = await flushTripSave();
    if (!outcome.ok) {
      flow.resolve({
        status: "save_failed",
        message: "当前激活行程保存失败，已取消创建新行程。",
      });
      return;
    }
    agentActions.setNewTripStage("dialog");
  }

  if (!isClient) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        data-testid="agent-fab"
        aria-label={open ? "关闭行程规划助手" : "打开行程规划助手"}
        className="fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg"
        onClick={() => agentActions.toggleOpen()}
      >
        <Bot aria-hidden />
      </Button>

      <Sheet
        open={open}
        onOpenChange={(value) => agentActions.setOpen(value)}
        modal={false}
        disablePointerDismissal
      >
        <SheetContent
          side="right"
          data-testid="agent-panel"
          className="z-[60] max-lg:inset-0 max-lg:h-full max-lg:w-full max-lg:max-w-none lg:inset-y-4 lg:right-4 lg:left-auto lg:h-auto lg:w-[400px] lg:rounded-xl lg:border"
        >
          <SheetHeader className="flex-row items-center justify-between gap-2 border-b pb-2">
            <SheetTitle>行程规划助手</SheetTitle>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="关闭 Agent 面板"
              onClick={() => agentActions.setOpen(false)}
            >
              <X aria-hidden />
            </Button>
          </SheetHeader>

          <Select
            value={targetValue}
            onValueChange={(value) => {
              if (value) selectTarget(value);
            }}
          >
            <SelectTrigger aria-label="规划目标" data-testid="agent-target" className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value === "new"
                    ? "新建行程"
                    : trips.data?.find((trip) => `existing:${trip.id}` === value)?.name ??
                      "选择规划目标"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">新建行程</SelectItem>
              {(trips.data ?? []).map((trip) => (
                <SelectItem key={trip.id} value={`existing:${trip.id}`}>
                  {trip.name}
                  {active?.id === trip.id ? "（激活中）" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <MessageScroller data-testid="agent-messages" className="px-1">
            {messages.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                描述城市、日期、宠物和想去的地点，我会在 Pawtrip 已收录地点中生成可确认的方案。
              </p>
            ) : null}
            {messages.map((message) => (
              <Message
                key={message.id}
                from={message.role === "user" ? "user" : "assistant"}
              >
                <MessageContent>
                  {message.parts.map((part, index) => (
                    <MessagePart key={`${message.id}-${index}`} part={part} />
                  ))}
                </MessageContent>
              </Message>
            ))}
            {chat.isLoading ? (
              <p className="px-2 text-xs text-muted-foreground" data-testid="agent-loading">
                正在生成…
              </p>
            ) : null}
          </MessageScroller>

          {flow?.stage === "confirm-deactivate" ? (
            <div
              data-testid="agent-deactivate-confirm"
              className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <p>
                创建新行程会取消当前激活行程。将先完成待发送的保存，保存成功后继续。
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void confirmDeactivation()}>
                  确认并继续
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => flow.resolve({ status: "cancelled" })}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : null}

          {flow?.stage === "dialog" ? (
            <CityTripDialog
              city={flow.city}
              initialStartDate={flow.startDate}
              initialEndDate={flow.endDate}
              initialPetId={flow.petId}
              navigateOnCreate={false}
              beforeCreate={async () => {
                if (!tripStore.state.active) return true;
                const outcome = await flushTripSave();
                return outcome.ok;
              }}
              onCreated={(trip) => {
                agentActions.setTarget({ kind: "existing", tripId: trip.id }, trip);
                flow.resolve({
                  status: "created",
                  tripId: trip.id,
                  city: {
                    adcode: flow.city.adcode,
                    name: flow.city.name,
                    province: flow.city.province,
                  },
                  totalDays: trip.totalDays,
                  petId: trip.petId,
                });
              }}
              onClose={() => flow.resolve({ status: "cancelled" })}
            />
          ) : null}

          {shownProposal && targetTrip ? (
            <ProposalCard
              proposal={shownProposal}
              targetTrip={targetTrip}
              names={names}
              applying={applying}
              error={applyError}
              onApply={() => void apply()}
              onReject={() => agentActions.setProposalStatus(shownProposal.id, "rejected")}
            />
          ) : null}

          {chat.error ? (
            <p role="alert" className="text-xs text-destructive">
              Agent 请求失败：{chat.error.message}
            </p>
          ) : null}

          <form
            className="flex flex-col gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <InputGroup>
              <InputGroupTextarea
                aria-label="向行程规划助手提问"
                placeholder="例如：帮我规划珠海两天的行程，带豆豆"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              <Button type="submit" size="sm" disabled={chat.isLoading || !input.trim()}>
                发送
              </Button>
            </InputGroup>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessagePart({ part }: { part: RenderedPart }) {
  if (part.type === "text") {
    return <Bubble variant="muted">{part.content ?? ""}</Bubble>;
  }
  if (part.type === "thinking") {
    return (
      <details className="w-full rounded-lg border bg-muted/30 px-2 py-1 text-xs">
        <summary className="cursor-pointer text-muted-foreground">思考过程</summary>
        <p className="mt-1 whitespace-pre-wrap">{part.content ?? ""}</p>
      </details>
    );
  }
  if (part.type === "tool-call" || part.type === "tool-result") {
    return (
      <div
        data-slot="tool"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-muted/40 px-2 py-1 text-xs",
        )}
      >
        <span className="font-medium">{toolLabel(part.name)}</span>
        <span className="text-muted-foreground">
          {part.type === "tool-result" ? part.state ?? "done" : part.state ?? "running"}
        </span>
      </div>
    );
  }
  return null;
}

function toolLabel(name: string | undefined): string {
  switch (name) {
    case "find_locations":
      return "查找地点";
    case "get_location_detail":
      return "读取地点详情";
    case "prepare_new_trip":
      return "创建行程确认";
    case "propose_trip_plan":
      return "生成方案";
    default:
      return name ?? "工具调用";
  }
}
