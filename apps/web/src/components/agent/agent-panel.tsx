import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { Bot, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { MessageScroller } from "@/components/ui/message-scroller";
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
  resolveAgentStatus,
  type AgentMessageLike,
  type AgentPartLike,
  type AgentStatusView,
} from "@/lib/agent/status";
import {
  useAgentLocationNames,
  useAgentNewTripFlow,
  useAgentOpen,
  useAgentProposals,
  usePendingProposal,
} from "@/lib/agent/selectors";
import { destinationsQueryOptions } from "@/queries/destinations";
import { locationBrowseDetailQueryOptions } from "@/queries/locations";
import { petsQueryOptions } from "@/queries/pets";
import {
  fetchTripDetail,
  tripQueryKeys,
} from "@/queries/trips";
import { flushTripSave } from "@/lib/trip/save";
import { tripActions, tripStore } from "@/lib/trip/store";
import { useActiveTrip } from "@/lib/trip/selectors";

export function AgentPanel() {
  const open = useAgentOpen();
  const active = useActiveTrip();
  const flow = useAgentNewTripFlow();
  const pending = usePendingProposal();
  const proposals = useAgentProposals();
  const shownProposal = proposals.length > 0 ? proposals[proposals.length - 1] : null;
  const names = useAgentLocationNames();
  const queryClient = useQueryClient();
  const isClient = typeof window !== "undefined";
  const activeId = active?.id ?? null;

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

  const [threadId] = useState(() => `trip-planning-${crypto.randomUUID()}`);
  const tools = useMemo(() => createAgentClientTools(queryClient), [queryClient]);
  const [input, setInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const lastActiveId = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (lastActiveId.current === undefined) {
      lastActiveId.current = activeId;
      return;
    }
    if (lastActiveId.current !== activeId) {
      agentActions.clearProposals();
      agentActions.resetAllowedPoiIds();
      lastActiveId.current = activeId;
    }
  }, [activeId]);

  useEffect(() => {
    setApplyError(null);
  }, [shownProposal?.id]);

  const city = useMemo(() => {
    const adcode = active?.cityAdcode;
    if (!adcode) return null;
    const candidate = (destinations.data ?? []).find((item) => item.adcode === adcode);
    return candidate
      ? { adcode: candidate.adcode, name: candidate.name, province: candidate.province }
      : { adcode, name: adcode, province: "" };
  }, [destinations.data, active?.cityAdcode]);

  const agentContext = useMemo(
    () =>
      buildAgentContext({
        active,
        pets: pets.data ?? [],
        city,
      }),
    [active, city, pets.data],
  );
  const forwardedProps = useMemo(() => ({ agentContext }), [agentContext]);
  const chat = useChat({
    connection: fetchServerSentEvents("/agent"),
    threadId,
    tools,
    forwardedProps,
  });

  const messages = chat.messages as unknown as ReadonlyArray<AgentMessageLike>;
  const visibleMessages = messages.filter(hasRenderableText);
  const statusView = resolveAgentStatus(messages, chat.isLoading);

  async function send() {
    const text = input.trim();
    if (!text || chat.isLoading) return;
    setInput("");
    setApplyError(null);
    agentActions.resetAllowedPoiIds();
    await chat.sendMessage(text, { body: { agentContext } });
  }

  async function apply() {
    if (!pending || !active) return;
    setApplying(true);
    setApplyError(null);
    const result = await applyProposal(pending, {
      activeTripId: active.id,
      fetchTrip: fetchTripDetail,
      flushSave: flushTripSave,
      replaceActivePlan: tripActions.replaceActivePlan,
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
      },
    });
    setApplying(false);
    if (result.ok) {
      agentActions.clearProposals();
    } else {
      agentActions.setProposalStatus(pending.id, "error");
      setApplyError(result.message);
    }
  }

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

          <p
            data-testid="agent-current-trip"
            className="text-xs text-muted-foreground"
          >
            {active
              ? `当前行程：${active.name}`
              : "未激活行程：可让助手通过确认弹窗创建新行程"}
          </p>

          <MessageScroller data-testid="agent-messages" className="px-1">
            {messages.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                描述城市、日期、宠物和想去的地点，我会在 Pawtrip 已收录地点中生成可确认的方案。
              </p>
            ) : null}
            {visibleMessages.map((message, messageIndex) => (
              <Message
                key={message.id ?? `message-${messageIndex}`}
                from={message.role === "user" ? "user" : "assistant"}
              >
                <MessageContent>
                  {(message.parts ?? []).map((part, index) => (
                    <MessagePart key={`${message.id}-${index}`} part={part} />
                  ))}
                </MessageContent>
              </Message>
            ))}
            <AgentStatusIndicator view={statusView} />
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

          {shownProposal && active ? (
            <ProposalCard
              proposal={shownProposal}
              targetTrip={active}
              names={names}
              applying={applying}
              error={applyError}
              onApply={() => void apply()}
              onReject={() => agentActions.clearProposals()}
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

function hasRenderableText(message: AgentMessageLike): boolean {
  return (message.parts ?? []).some(
    (part) => part.type === "text" && (part.content ?? "").trim() !== "",
  );
}

function MessagePart({ part }: { part: AgentPartLike }) {
  if (part.type === "text") {
    return <Bubble variant="muted">{part.content ?? ""}</Bubble>;
  }
  return null;
}

function AgentStatusIndicator({ view }: { view: AgentStatusView }) {
  if (!view.active && view.completed.length === 0) {
    return null;
  }
  return (
    <div data-testid="agent-status" className="flex flex-col gap-1 px-2 py-1 text-xs">
      {view.active ? (
        <div
          data-testid="agent-status-active"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          <span>正在{view.active.action}</span>
        </div>
      ) : null}
      {view.completed.length > 0 ? (
        <details
          data-testid="agent-completed-steps"
          className="rounded-lg border bg-muted/30 px-2 py-1"
        >
          <summary className="cursor-pointer text-muted-foreground">
            已完成 {view.completed.length} 个步骤
          </summary>
          <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
            {view.completed.map((step) => (
              <li key={step.key}>{step.action}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
