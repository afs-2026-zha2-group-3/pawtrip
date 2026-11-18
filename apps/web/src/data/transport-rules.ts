// 交通携宠规则目录：本文件是规则内容的唯一真源（前端常量，不依赖后端接口）。
// 规则为人工摘录自官方渠道，合并前须逐条复核来源；页面与免责文案以承运方最新规则为准。
// 更新规则 = 修改本文件 + 更新 verifiedOn。
// containerRequirement/procedureSummary 为分号分隔的要点短句，页面按分号拆分分点展示（2026-11-17 精简）。

export type TransportMode = "flight" | "high_speed_rail" | "train" | "drive";

export type TransportForm = "checked" | "cabin" | "isolated_checked" | "self";

export type AllowanceStatus = "allowed" | "conditional" | "not_allowed";

export interface TransportRule {
  /** 稳定标识，供后续宠物档案对比（US-06）与证明清单（US-07）引用 */
  id: string;
  mode: TransportMode;
  carrierCode: string | null;
  carrierName: string | null;
  transportForm: TransportForm;
  /** 状态标识唯一数据源；页面不得按方式硬编码 */
  allowanceStatus: AllowanceStatus;
  allowanceNote: string | null;
  allowedSummary: string;
  /** 空值语义：无统一体重上限（如自驾） */
  weightLimitKg: number | null;
  weightLimitNote: string;
  /** 空值语义：无统一肩高上限（仅高铁为 40cm） */
  shoulderLimitCm: number | null;
  containerRequirement: string;
  procedureSummary: string;
  /** 扩展列取值；是否展示由页面列配置决定，不影响基础四列 */
  extra: Record<string, string>;
  sourceUrl: string;
  sourceTitle: string;
  /** 人工复核日期（ISO）；为空表示未复核，不得发布 */
  verifiedOn: string | null;
  sortOrder: number;
}

export const transportModeLabels: Record<TransportMode, string> = {
  flight: "飞机",
  high_speed_rail: "高铁",
  train: "火车",
  drive: "自驾",
};

export const transportFormLabels: Record<TransportForm, string> = {
  checked: "托运",
  cabin: "客舱",
  isolated_checked: "隔离托运",
  self: "自驾",
};

export const allowanceStatusLabels: Record<AllowanceStatus, string> = {
  allowed: "可携带",
  conditional: "有条件",
  not_allowed: "不可",
};

/** 表格行顺序：调整本数组即调整页面行顺序 */
export const transportRuleRowModes: readonly TransportMode[] = [
  "flight",
  "high_speed_rail",
  "train",
  "drive",
];

const transportRules: readonly TransportRule[] = [
  {
    id: "flight-ca-checked",
    mode: "flight",
    carrierCode: "CA",
    carrierName: "中国国际航空",
    transportForm: "checked",
    allowanceStatus: "conditional",
    allowanceNote: "短鼻品种、攻击性品种、部分机型及赴美航线不承运",
    allowedSummary: "仅限家庭驯养猫、犬，货舱供氧托运",
    weightLimitKg: 32,
    weightLimitNote: "每只含容器、水与食物 ≤32kg；每旅客限 1 只",
    shoulderLimitCm: null,
    containerRequirement:
      "专用航空箱（玻璃纤维/金属/硬塑等）；三面通风、金属网门；实底防渗漏铺吸湿垫；可站立转身趴卧",
    procedureSummary:
      "订座时申请经国航同意；起飞前 120 分钟到机场办理；备检疫证明（国际另需出入境文件）；签免责声明；按逾重行李收费",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》，国际航班另需出入境文件",
    },
    sourceUrl: "https://m.airchina.com.cn/c/invoke/xlxxnext/xlxxnext8@pg",
    sourceTitle: "国航：作为行李托运的小动物",
    verifiedOn: "2026-11-16",
    sortOrder: 10,
  },
  {
    id: "flight-mu-checked",
    mode: "flight",
    carrierCode: "MU",
    carrierName: "中国东方航空",
    transportForm: "checked",
    allowanceStatus: "conditional",
    allowanceNote: "仅限东航、上航实际承运的直达航班",
    allowedSummary: "仅限家庭饲养猫、犬，货舱供氧托运",
    weightLimitKg: 32,
    weightLimitNote: "每个独立包装（含食物与水）≤32kg；国内每旅客最多 2 只",
    shoulderLimitCm: null,
    containerRequirement: "专用航空箱，分大/中/小号（中号 ≥81×55×58cm）",
    procedureSummary:
      "起飞前 7 天至 48 小时申请（国际不迟于 48 小时）；渠道：售票处/95530/官网/APP；交《小动物运输申请书》与检疫证明",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》，国际或地区航班另需卫生证书",
    },
    sourceUrl:
      "https://www.ceair.com/global/static/Announcement/TravelTips/SpecialPassengerServiceNotice/LittleAnimal/",
    sourceTitle: "东航：小动物运输服务须知",
    verifiedOn: "2026-11-16",
    sortOrder: 20,
  },
  {
    id: "flight-cz-checked",
    mode: "flight",
    carrierCode: "CZ",
    carrierName: "中国南方航空",
    transportForm: "checked",
    allowanceStatus: "conditional",
    allowanceNote: "短鼻猫犬拒运，不接受联程，怀孕个体拒运",
    allowedSummary: "家庭饲养狗、猫、鸟等玩赏宠物可托运，须供氧货舱",
    weightLimitKg: 32,
    weightLimitNote: "笼体包装 ≤40×60×100cm；总重 ≤32kg；每旅客 1 只（或一对鸟）",
    shoulderLimitCm: null,
    containerRequirement:
      "坚固金属/硬塑/木制航空箱；至少三面通风、金属门带锁；底部防滑加吸水垫；外罩防护网并井字打包",
    procedureSummary:
      "至少起飞前 72 小时申请待回复；离站前 90 分钟到机场办理；备县区级以上检疫证明；犬猫签免责书；按逾重行李收费",
    extra: {
      quarantineRequirement: "需县区级以上《动物检疫合格证明》",
    },
    sourceUrl:
      "https://www.csair.com/sg/zh/tourguide/luggage_service/checked_luggage/live_animals/",
    sourceTitle: "南航：小动物运输",
    verifiedOn: "2026-11-16",
    sortOrder: 30,
  },
  {
    id: "flight-hu-checked",
    mode: "flight",
    carrierCode: "HU",
    carrierName: "海南航空",
    transportForm: "checked",
    allowanceStatus: "conditional",
    allowanceNote: "出生不足 8 周等不宜航空旅行的个体不承运",
    allowedSummary: "猫、犬可货舱托运，须供氧货舱",
    weightLimitKg: 32,
    weightLimitNote: "每个独立包装（宠物、箱体、食物与水）≤32kg",
    shoulderLimitCm: null,
    containerRequirement:
      "专用航空箱：站立耳不触顶；长＝宠物长＋0.5×宽、宽＝宠物宽×2、高＝站立高",
    procedureSummary:
      "提前官网或客服申请；当日携宠物、航空箱与证明到值机柜台；按超限行李收费",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》",
    },
    sourceUrl: "https://www.hnair.com/lvxingxinxi/tsgh/tyxdw/",
    sourceTitle: "海南航空：宠物托运",
    verifiedOn: "2026-11-16",
    sortOrder: 40,
  },
  {
    id: "flight-hu-cabin",
    mode: "flight",
    carrierCode: "HU",
    carrierName: "海南航空",
    transportForm: "cabin",
    allowanceStatus: "conditional",
    allowanceNote: "仅部分航线开放，需提前申请占座",
    allowedSummary: "部分航线允许宠物进入客舱，仅限猫、犬",
    weightLimitKg: 5,
    weightLimitNote: "含笼 ≤5kg；箱体 ≤35×28×24cm，置于前排座椅下",
    shoulderLimitCm: null,
    containerRequirement: "软质或专用宠物箱 ≤35×28×24cm；置于前排座椅下",
    procedureSummary:
      "提前申请并占座；费用以航司公布为准；起飞前 2.5–3 小时携宠物、协议书与证明到柜台办理",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》与客舱运输协议书",
    },
    sourceUrl: "https://www.hnair.com/adnews/cwkcgafu/",
    sourceTitle: "海南航空：客舱运输宠物规定",
    verifiedOn: "2026-11-16",
    sortOrder: 50,
  },
  {
    id: "high-speed-rail-isolated",
    mode: "high_speed_rail",
    carrierCode: null,
    carrierName: null,
    transportForm: "isolated_checked",
    allowanceStatus: "conditional",
    allowanceNote: "不可进客舱，须同车隔离托运或单独托运；仅限猫、犬",
    allowedSummary: "可同车隔离托运或单独托运，宠物不可进客舱",
    weightLimitKg: 15,
    weightLimitNote: "单只 ≤15kg，且肩高 ≤40cm、身长 ≤52cm",
    shoulderLimitCm: 40,
    containerRequirement:
      "中铁快运专用宠物运输箱（供氧、温湿度监测）；人宠分开、全程不开箱",
    procedureSummary:
      "12306 App 预约带「宠」车次同车仓位，或中铁快运小程序提前 2–5 天约单独行；乘车前携宠物、身份证与检疫证明到营业部办理；到站按短信领取",
    extra: {
      quarantineRequirement: "需有效期内《动物检疫合格证明》",
    },
    sourceUrl:
      "http://wap.china-railway.com.cn/xwzx/zhxw/202604/t20260409_155381.html",
    sourceTitle: "国铁集团：高铁宠物托运「爱宠行」服务",
    verifiedOn: "2026-11-16",
    sortOrder: 100,
  },
  {
    id: "train-baggage",
    mode: "train",
    carrierCode: null,
    carrierName: null,
    transportForm: "isolated_checked",
    allowanceStatus: "conditional",
    allowanceNote: "不可进客舱，导盲犬等工作犬除外",
    allowedSummary: "可经行李车行包托运，需确认到发城市间开办行包运输",
    weightLimitKg: 20,
    weightLimitNote: "猫、犬 ≤20kg，以 12306 或 95572 现行口径为准",
    shoulderLimitCm: null,
    containerRequirement: "自备坚固、防逃逸、防排泄物外溢容器",
    procedureSummary:
      "致电 12306/95572 确认行包服务；办检疫证明；乘车前到行包房托运；到站提取",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》，具体以到站要求为准",
    },
    sourceUrl: "http://railway.china.com.cn/2025-04/09/content_117813396.shtml",
    sourceTitle: "铁路普速列车宠物托运口径（北青报转述国铁集团/95572）",
    verifiedOn: "2026-11-16",
    sortOrder: 110,
  },
  {
    id: "drive-self",
    mode: "drive",
    carrierCode: null,
    carrierName: null,
    transportForm: "self",
    allowanceStatus: "allowed",
    allowanceNote: null,
    allowedSummary: "允许携宠乘车，不得妨碍安全驾驶",
    weightLimitKg: null,
    weightLimitNote: "无统一限制，以车辆空间与安全固定为准",
    shoulderLimitCm: null,
    containerRequirement:
      "航空箱或车载安全带固定于后排；禁止副驾抱宠、干扰驾驶",
    procedureSummary:
      "无承运方手续；跨省建议备检疫证明；行前健康评估、途中通风休息",
    extra: {
      quarantineRequirement: "无统一要求，跨省建议备《动物检疫合格证明》",
    },
    sourceUrl: "https://jtgl.beijing.gov.cn/jgj/jgxx/flfg/xzfg/119781/index.html",
    sourceTitle: "道路交通安全法实施条例（第六十二条：不得有妨碍安全驾驶的行为）",
    verifiedOn: "2026-11-16",
    sortOrder: 120,
  },
];

/** 按交通方式取规则，按 sortOrder 升序 */
export function getRulesByMode(mode: TransportMode): TransportRule[] {
  return transportRules
    .filter((rule) => rule.mode === mode)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

/** 飞机行下拉的航司选项：同一航司只取排序最前的一条记录（海航取托运形态） */
export function getFlightRules(): TransportRule[] {
  const seenCarriers = new Set<string>();

  return getRulesByMode("flight").filter((rule) => {
    if (!rule.carrierCode || seenCarriers.has(rule.carrierCode)) {
      return false;
    }
    seenCarriers.add(rule.carrierCode);
    return true;
  });
}

/** 每条方式的代表记录（飞机行为默认航司） */
export function getRuleForMode(mode: TransportMode): TransportRule | null {
  return getRulesByMode(mode)[0] ?? null;
}

export function getRuleById(id: string): TransportRule | undefined {
  return transportRules.find((rule) => rule.id === id);
}
