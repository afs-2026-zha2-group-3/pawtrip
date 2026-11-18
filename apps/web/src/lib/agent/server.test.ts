import { describe, expect, it, vi } from "vitest";
import { fakeText } from "@tanstack/ai/testing";
import { AGENT_TOOL_NAMES } from "./constants";
import { handleAgentRequest } from "./server";

const body = JSON.stringify({
  threadId: "thread-1",
  runId: "run-1",
  messages: [{ id: "m1", role: "user", content: "你好" }],
  tools: [
    { name: "find_locations", description: "allowed", parameters: { type: "object" } },
    { name: "evil_fetch", description: "not allowed", parameters: { type: "object" } },
  ],
  context: [],
  forwardedProps: {
    agentContext: { mode: "existing", targetTripId: 9, constraints: [] },
  },
  state: null,
});

function request(cookie: string | null = "JSESSIONID=session") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  return new Request("http://localhost/agent", {
    method: "POST",
    headers,
    body,
  });
}

function authResponse(status: number): Response {
  return new Response(null, { status });
}

describe("agent server route", () => {
  it("rejects a request without a session cookie", async () => {
    const authFetch = vi.fn();
    const response = await handleAgentRequest(request(null), {
      env: { PAWTRIP_AGENT_PROVIDER: "fake", NODE_ENV: "test" },
      fetch: authFetch as unknown as typeof fetch,
    });

    expect(response.status).toBe(401);
    expect(authFetch).not.toHaveBeenCalled();
  });

  it("rejects a request when Spring reports an expired session", async () => {
    const response = await handleAgentRequest(request(), {
      env: { PAWTRIP_AGENT_PROVIDER: "fake", NODE_ENV: "test" },
      fetch: vi.fn(async () => authResponse(401)) as unknown as typeof fetch,
    });

    expect(response.status).toBe(401);
  });

  it("returns 502 when the session endpoint is unreachable", async () => {
    const response = await handleAgentRequest(request(), {
      env: { PAWTRIP_AGENT_PROVIDER: "fake", NODE_ENV: "test" },
      fetch: vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }) as unknown as typeof fetch,
    });

    expect(response.status).toBe(502);
  });

  it("passes only allowlisted tools to the model", async () => {
    const adapter = fakeText();
    let toolNames: string[] = [];
    adapter.setResponses([
      ({ request: options }) => {
        toolNames = (options.tools ?? []).map((tool) => tool.name);
        return { text: "ok" };
      },
    ]);

    const response = await handleAgentRequest(request(), {
      env: { PAWTRIP_AGENT_PROVIDER: "fake", NODE_ENV: "test" },
      fetch: vi.fn(async () => authResponse(200)) as unknown as typeof fetch,
      createAdapter: () => adapter,
    });

    expect(response.status).toBe(200);
    await response.text();
    expect(new Set(toolNames)).toEqual(new Set(AGENT_TOOL_NAMES));
    expect(toolNames).not.toContain("evil_fetch");
  });

  it("refuses to run the fake provider in production", async () => {
    const response = await handleAgentRequest(request(), {
      env: { PAWTRIP_AGENT_PROVIDER: "fake", NODE_ENV: "production" },
      fetch: vi.fn(async () => authResponse(200)) as unknown as typeof fetch,
    });

    expect(response.status).toBe(500);
  });
});
