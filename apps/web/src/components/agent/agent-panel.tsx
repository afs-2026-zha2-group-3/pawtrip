import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { Bot, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bubble } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { AgentMarkdown } from "@/components/agent/agent-markdown";
import { ProposalCard } from "@/components/agent/proposal-card";
import { CompanionBubble } from "@/components/companion/companion";
import { CityTripDialog } from "@/routes/_authenticated/-city-trip-dialog";
import { applyProposal } from "@/lib/agent/apply";
import { createAgentClientTools } from "@/lib/agent/client-tools";
import { buildAgentContext } from "@/lib/agent/context";
import {
  buildAgentTurns,
  type AgentMessageLike,
  type AgentProcessItem,
} from "@/lib/agent/messages";
import { agentActions } from "@/lib/agent/store";
import {
  useAgentLocationNames,
  useAgentNewTripFlow,
  useAgentOpen,
  useAgentProposals,
  usePendingProposal,
} from "@/lib/agent/selectors";
import { destinationsQueryOptions } from "@/queries/destinations";
import { locationBrowseDetailQueryOptions } from "@/queries/locations";
import { petsPreviewQueryOptions, petsQueryOptions, type Pet } from "@/queries/pets";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
  // 气泡在面板关闭时也要展示宠物名；用只读预览缓存兜底，避免预热列表页的共享缓存。
  // 管理端不展示气泡，无需额外请求（该请求的 401 会触发全局缓存清理）。
  const showCompanion = !pathname.startsWith("/admin");
  const companionPets = useQuery<Pet[]>({
    ...petsPreviewQueryOptions(),
    enabled: isClient && showCompanion && pets.data === undefined,
    throwOnError: false,
  });
  const companionName =
    pets.data?.[0]?.name ?? companionPets.data?.[0]?.name ?? "豆包";

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
      ? {
          adcode: candidate.adcode,
          name: candidate.name,
          province: candidate.province,
          featureTags: candidate.featureTags ?? [],
        }
      : { adcode, name: adcode, province: "", featureTags: [] };
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
  const turns = buildAgentTurns(messages, chat.isLoading);

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

  // 悬浮宽度与地点浏览页 2xl 留白轨道（376px）耦合；修改宽度时需同步 attractions/index.tsx。
  return (
    <>
      {/* 外壳只负责定位：方形命中区会盖住圆形 FAB 角落下方的面板控件，需让外壳透传指针。 */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[70]">
        <CompanionBubble pathname={pathname} name={companionName} panelOpen={open} />
        <Button
          type="button"
          data-testid="agent-fab"
          aria-label="打开行程规划助手"
          aria-expanded={open}
          className="pointer-events-auto size-12 rounded-full shadow-lg"
          onClick={() => agentActions.setOpen(true)}
        >
          <Bot aria-hidden />
        </Button>
      </div>

      <Sheet
        open={open}
        onOpenChange={(value) => agentActions.setOpen(value)}
        modal={false}
        disablePointerDismissal
      >
        <SheetContent
          side="right"
          data-testid="agent-panel"
          className="z-[60] max-lg:inset-0 max-lg:h-full max-lg:w-full max-lg:max-w-none lg:top-24 lg:right-4 lg:bottom-4 lg:left-auto lg:h-auto lg:w-[400px] lg:rounded-xl lg:border"
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
            {turns.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                描述城市、日期、宠物和想去的地点，我会在 Pawtrip 已收录地点中生成可确认的方案。
              </p>
            ) : null}
            {turns.map((turn) => (
              <Fragment key={turn.key}>
                {turn.user ? (
                  <Message from="user">
                    <MessageContent className="items-end">
                      <Bubble
                        variant="default"
                        className="bg-emerald-100 text-black"
                      >
                        {turn.user.text}
                      </Bubble>
                    </MessageContent>
                  </Message>
                ) : null}
                {turn.process.length > 0 ? (
                  turn.active ? (
                    <AgentProcess items={turn.process} />
                  ) : (
                    <details
                      data-testid="agent-process-collapsed"
                      className="group px-2 py-1 text-xs text-muted-foreground"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-1 select-none marker:hidden [&::-webkit-details-marker]:hidden">
                        <ChevronRight
                          aria-hidden="true"
                          className="size-3.5 shrink-0 transition-transform group-open:rotate-90"
                        />
                        已完成思考
                      </summary>
                      <AgentProcess items={turn.process} />
                    </details>
                  )
                ) : null}
                {turn.reply ? (
                  <Message from="assistant">
                    <MessageContent className="gap-1">
                      <AgentMarkdown text={turn.reply.text} />
                    </MessageContent>
                  </Message>
                ) : null}
                {turn.active ? <AgentThinking /> : null}
              </Fragment>
            ))}
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
                    featureTags: flow.city.featureTags ?? [],
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

function AgentProcess({ items }: { items: AgentProcessItem[] }) {
  return (
    <div data-testid="agent-process" className="flex flex-col gap-1 px-2 py-1">
      {items.map((item) =>
        item.kind === "text" ? (
          <p
            key={item.key}
            className="text-xs whitespace-pre-wrap text-muted-foreground"
          >
            {item.text}
          </p>
        ) : (
          <span
            key={item.key}
            data-testid="agent-tool-tag"
            className="w-fit rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {item.label}
            {item.count > 1 ? ` x${item.count}` : ""}
          </span>
        ),
      )}
    </div>
  );
}

function AgentThinking() {
  return (
    <div
      data-testid="agent-status"
      className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      <span>正在思考</span>
    </div>
  );
}
