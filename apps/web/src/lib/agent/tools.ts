import { toolDefinition } from "@tanstack/ai";
import { AGENT_ALLOWED_TOOL_NAMES } from "./constants";

const stopSchema = {
  type: "object",
  properties: {
    poiId: { type: "string", description: "Pawtrip 已收录地点的 poiId" },
    toNext: {
      type: "string",
      enum: ["walk", "drive", "transit"],
      description: "前往下一地点的交通方式，可省略",
    },
  },
  required: ["poiId"],
  additionalProperties: false,
};

const planSchema = {
  type: "object",
  properties: {
    version: { type: "number", enum: [1] },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "number", description: "从 1 开始，不超过目标行程总天数" },
          stops: { type: "array", items: stopSchema },
        },
        required: ["day", "stops"],
        additionalProperties: false,
      },
    },
    unscheduled: {
      type: "array",
      items: {
        type: "object",
        properties: { poiId: { type: "string" } },
        required: ["poiId"],
        additionalProperties: false,
      },
    },
  },
  required: ["version", "days", "unscheduled"],
  additionalProperties: false,
};

export const findLocationsTool = toolDefinition({
  name: "find_locations",
  description:
    "按规划目标城市查询 Pawtrip 已收录地点。只返回真实 poiId；名称不唯一时 ambiguous=true，需要让用户消歧。",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "地点名称或地址关键词；留空返回目录前若干条",
      },
      typeGroup: {
        type: "string",
        enum: ["attraction", "hotel", "pet-hospital", "pet-supplies", "restaurant"],
        description: "可选地点类型；目录被截断时用于缩小范围",
      },
    },
    additionalProperties: false,
  },
});

export const getLocationDetailTool = toolDefinition({
  name: "get_location_detail",
  description: "读取一个 Pawtrip 已收录地点的详情与确定性宠物政策结论。",
  inputSchema: {
    type: "object",
    properties: {
      poiId: { type: "string", description: "find_locations 返回的 poiId" },
    },
    required: ["poiId"],
    additionalProperties: false,
  },
});

export const prepareNewTripTool = toolDefinition({
  name: "prepare_new_trip",
  description:
    "为新行程打开 Pawtrip 现有创建行程确认弹窗并等待用户确认。日期含首尾需为 1–7 天；宠物必须是用户已有宠物。",
  inputSchema: {
    type: "object",
    properties: {
      cityName: { type: "string", description: "城市名称，例如 珠海" },
      startDate: { type: "string", description: "YYYY-MM-DD" },
      endDate: { type: "string", description: "YYYY-MM-DD" },
      petName: { type: "string", description: "用户已有宠物名称，可省略" },
    },
    required: ["cityName", "startDate", "endDate"],
    additionalProperties: false,
  },
});

export const proposeTripPlanTool = toolDefinition({
  name: "propose_trip_plan",
  description:
    "提交一个待用户确认的行程计划。只能引用地点工具返回过的 poiId；只针对已持久化行程。",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["existing"] },
          tripId: { type: "number" },
        },
        required: ["kind", "tripId"],
        additionalProperties: false,
      },
      plan: planSchema,
      summary: { type: "string" },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["target", "plan", "summary"],
    additionalProperties: false,
  },
});

export const AGENT_TOOL_DEFINITIONS = [
  findLocationsTool,
  getLocationDetailTool,
  prepareNewTripTool,
  proposeTripPlanTool,
] as const;

export function isAllowedAgentToolName(name: string): boolean {
  return AGENT_ALLOWED_TOOL_NAMES.has(name);
}
