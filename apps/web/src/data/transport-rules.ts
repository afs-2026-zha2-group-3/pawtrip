// 交通携宠规则目录：本文件是规则内容的唯一真源（前端常量，不依赖后端接口）。
// 规则为人工摘录自官方渠道，合并前须逐条复核来源；页面与免责文案以承运方最新规则为准。
// 更新规则 = 修改本文件 + 更新 verifiedOn。

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

/** 宠物档案录入路由：US-06 定名后只改此处常量 */
export const PET_PROFILE_PATH = "/paws/profile";

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
    containerRequirement:
      "航空专用旅行容器：玻璃纤维、金属、硬质塑料、焊网或硬木板；三面通风 ≥16%，开口覆金属网，实底防渗漏并铺吸湿垫料，固定水具食具，满足站立、转身与趴卧",
    procedureSummary:
      "订座时提出申请并经国航同意；起飞当日不迟于起飞前 120 分钟自行运至机场办理；出示《动物检疫合格证明》（国际航班另需出入境文件）；签署免责声明；按逾重行李收费",
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
    containerRequirement:
      "专用航空箱，分大、中、小号（中号 ≥81×55×58cm 且 <91×60×66cm，小号 <81×55×58cm）",
    procedureSummary:
      "国内航班起飞前 7 天至前 48 小时申请，国际（地区）航班不迟于前 48 小时；渠道为直属售票处、95530、官网或 APP；提交《小动物运输申请书》与《动物检疫合格证明》（国际另需卫生证书）",
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
    containerRequirement:
      "坚固金属、硬塑或木制航空箱：顶部固定、至少三面通风、金属门带锁、底部防滑并加吸水衬垫，外加防护网与井字打包带",
    procedureSummary:
      "定座时提出，至少起飞前 72 小时申请并等待南航回复；乘机当日离站前 90 分钟到机场办理；携带县区级以上《动物检疫合格证明》；犬猫需签免责书；国内按逾重行李收费",
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
    containerRequirement:
      "专用航空箱：站立时耳不触顶；长 = 宠物长 + 0.5 × 宽，宽 = 宠物宽 × 2，高 = 站立高度；按超限行李收费，不计免费行李额",
    procedureSummary:
      "提前通过官网或客服申请；乘机当日携宠物、航空箱与证明文件到值机柜台办理；按超限行李收费",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》",
    },
    sourceUrl: "https://www.hnair.com/lvxingxinxi/tsgh/tyxdw/",
    sourceTitle: "海南航空：宠物托运",
    verifiedOn: null,
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
    containerRequirement: "软质或专用宠物箱，长 × 宽 × 高 ≤35×28×24cm，置于前排座椅下",
    procedureSummary:
      "提前申请并占用座位；客舱基础费 1430 元/航段/只（额外占座按经济舱票价叠加，每旅客最多 2 只占座）；乘机当日携宠物、宠物箱、协议书与证明文件，起飞前 2.5–3 小时到值机柜台办理",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》与客舱运输协议书",
    },
    sourceUrl: "https://www.hnair.com/adnews/cwkcgafu/",
    sourceTitle: "海南航空：客舱运输宠物规定",
    verifiedOn: null,
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
    containerRequirement:
      "全程置于中铁快运专用宠物运输箱（供氧、温湿度监测），存放于高铁快运柜，人宠分开、全程不开箱",
    procedureSummary:
      "12306 App「宠物托运」查询带「宠」字车次并预约同车仓位（12 时前最早约次日，12 时后最早约第三日，每旅客最多 2 只）；或以「中铁快运」小程序提前 2–5 天预约单独行（每客户单趟 1 只）；乘车前携宠物、身份证件与有效期内《动物检疫合格证明》到出发站中铁快运营业部办理，到站按短信领取",
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
    containerRequirement: "自备坚固、防逃逸、防排泄物外溢的装运容器",
    procedureSummary:
      "先致电 12306 或中铁快运 95572 确认行包服务与容器要求；办理《动物检疫合格证明》；乘车前到车站行包房托运；到站提取",
    extra: {
      quarantineRequirement: "需《动物检疫合格证明》，具体以到站要求为准",
    },
    sourceUrl:
      "https://mobile.12306.cn/otsmobile/h5/otsbussiness/info/prohibitedGoods.html",
    sourceTitle: "铁路旅客禁止、限制携带和托运物品目录",
    verifiedOn: null,
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
    containerRequirement:
      "建议航空箱或宠物车载安全带固定于后排；禁止副驾抱宠，禁止宠物干扰驾驶",
    procedureSummary:
      "无承运方手续；跨省建议备《动物检疫合格证明》（各地执法口径不一）；行前健康评估，途中通风休息，住宿确认宠物友好",
    extra: {
      quarantineRequirement: "无统一要求，跨省建议备《动物检疫合格证明》",
    },
    sourceUrl: "https://m.pcauto.com.cn/wenda/4656385.html",
    sourceTitle: "自驾携宠出行注意事项（通用汇编）",
    verifiedOn: null,
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
