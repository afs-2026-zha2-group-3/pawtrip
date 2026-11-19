/**
 * Agent 地点目录查询约定（对应 openspec task 1.1）：
 * - 仅使用登录后可读的 `GET /api/locations`，regionCode 必须是城市级 adcode
 *   （E2E 为 `440400`；`440402` 只是地点 region_code，不能作为查询参数）。
 * - 不传 typeGroup 一次取全部类型，petFriendlyOnly=false，pageSize 固定 100
 *   （服务端上限 100）；最多抓取 20 页，超限时告知结果可能不完整。
 * - 列表接口没有名称检索，匹配在浏览器端按名称/地址完成。
 * - `GET /api/locations/{poiId}` 读取详情与宠物政策；
 *   `GET /api/locations/types` 只用于类型标签。
 * - 后端 `TripService.validatePoiIds` 只校验 POI 是否存在，不校验同城；
 *   同城约束由 Agent 地点目录与前端方案校验强制。
 */
export const AGENT_CATALOG_PAGE_SIZE = 100;
export const AGENT_CATALOG_MAX_PAGES = 20;
export const AGENT_CATALOG_CANDIDATE_LIMIT = 20;

export const AGENT_ENDPOINT = "/agent";
export const AGENT_DEFAULT_MODEL = "glm-5.3-flash";
export const AGENT_BIGMODEL_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

/**
 * 智谱 GLM-5.2+ 的推理强度档位。glm-5.3 强制思考，不能传 disabled，
 * 只能用 reasoning_effort 在 low/high/max 之间调整。
 */
export const AGENT_REASONING_EFFORTS = ["low", "high", "max"] as const;
export type AgentReasoningEffort = (typeof AGENT_REASONING_EFFORTS)[number];
export const AGENT_DEFAULT_REASONING_EFFORT: AgentReasoningEffort = "low";

export const AGENT_TOOL_NAMES = [
  "find_locations",
  "get_location_detail",
  "get_trip_plan",
  "prepare_new_trip",
  "update_trip_plan",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

export const AGENT_ALLOWED_TOOL_NAMES: ReadonlySet<string> = new Set(AGENT_TOOL_NAMES);
