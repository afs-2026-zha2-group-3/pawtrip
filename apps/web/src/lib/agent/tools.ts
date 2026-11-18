import { toolDefinition } from "@tanstack/ai";
import { AGENT_ALLOWED_TOOL_NAMES } from "./constants";

export const findLocationsTool = toolDefinition({
  name: "find_locations",
  description:
    "按当前激活行程城市查询 Pawtrip 已收录地点，匹配覆盖名称、地址与地点标签。只返回真实 poiId，并在可用时包含标签与评分；名称不唯一时 ambiguous=true，需要让用户消歧。",
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
  description:
    "读取一个 Pawtrip 已收录地点的推荐信息（自然语言类型、区域、评分、标签、商圈、每周营业时间、今日营业时间与电话）与确定性宠物政策结论。",
  inputSchema: {
    type: "object",
    properties: {
      poiId: { type: "string", description: "find_locations 返回的 poiId" },
    },
    required: ["poiId"],
    additionalProperties: false,
  },
});

export const getTripPlanTool = toolDefinition({
  name: "get_trip_plan",
  description:
    "读取当前激活行程的最新计划（以客户端 store 为准，包含每天的地点、顺序、名称与 revision）。修改行程前必须先调用；不要依赖历史消息中的计划。",
  inputSchema: {
    type: "object",
    properties: {},
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

const planOperationSchema = {
  type: "object",
  properties: {
    op: {
      type: "string",
      enum: ["add_stop", "remove_stop", "add_unscheduled", "remove_unscheduled"],
      description:
        "add_stop 添加地点到指定天；remove_stop 从行程移除地点；add_unscheduled/remove_unscheduled 调整未排期列表",
    },
    poiId: { type: "string", description: "Pawtrip 已收录地点的 poiId" },
    day: { type: "number", description: "第几天，从 1 开始" },
    position: {
      type: "number",
      description: "add_stop 插入位置（从 0 开始），省略时追加到当天末尾",
    },
    toNext: {
      type: "string",
      enum: ["walk", "drive", "transit"],
      description: "前往下一地点的交通方式，可省略",
    },
  },
  required: ["op", "poiId"],
  additionalProperties: false,
};

export const updateTripPlanTool = toolDefinition({
  name: "update_trip_plan",
  description:
    "在当前激活行程的增量操作基础上生成待确认方案，不会整份替换计划。必须先调用 get_trip_plan 获取 baseRevision；调整顺序或跨天移动时，先 remove_stop 再用 add_stop 指定 position。多个改动放入 operations 数组。只能引用地点工具返回过或已在计划中的 poiId。",
  inputSchema: {
    type: "object",
    properties: {
      targetTripId: { type: "number", description: "当前激活行程的 id" },
      baseRevision: {
        type: "string",
        description: "get_trip_plan 返回的 revision；与当前 store 不一致时拒绝修改",
      },
      operations: {
        type: "array",
        maxItems: 30,
        items: planOperationSchema,
      },
      summary: { type: "string", description: "面向用户的变更摘要" },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["targetTripId", "baseRevision", "operations", "summary"],
    additionalProperties: false,
  },
});

export const AGENT_TOOL_DEFINITIONS = [
  findLocationsTool,
  getLocationDetailTool,
  getTripPlanTool,
  prepareNewTripTool,
  updateTripPlanTool,
] as const;

export function isAllowedAgentToolName(name: string): boolean {
  return AGENT_ALLOWED_TOOL_NAMES.has(name);
}
