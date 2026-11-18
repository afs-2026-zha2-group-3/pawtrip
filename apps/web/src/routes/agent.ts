/// <reference types="@tanstack/react-start" />
import { createFileRoute } from "@tanstack/react-router";
import { handleAgentRequest } from "../lib/agent/server";

export const Route = createFileRoute("/agent")({
  server: {
    handlers: {
      POST: ({ request }) => handleAgentRequest(request),
    },
  },
});
