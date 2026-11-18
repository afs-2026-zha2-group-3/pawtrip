import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  csrfHeaders,
  openCities,
  resetTrips,
  signIn,
  workerUsername,
} from "./trip-helpers";

// 该套件需要反复翻页遍历全部城市；全量并发时给分页遍历更宽的时间窗口，业务断言保持不变。
test.describe.configure({ timeout: 120_000 });

// REQ-014 城市个性化推荐（atdd-design §2 E2E 表）。
// 账号策略：沿用 worker 账号（与 destination-selection 同槽位串行），避免与 paws（demo）并发冲突；
// 造数走 POST /api/pets、清理走 DELETE（不 mock 档案接口）；种子宠物（豆豆/毛毛，新列 NULL）
// 经 PAWTRIP_E2E_DB_PATH 直连临时库在 beforeAll/afterAll 精确快照/恢复（毛毛无品种，API 无法等价重建），
// 保证同 worker 后续套件（destination-selection E4 等）不受污染。直连先例见 city-pet-policy.spec.ts。

// V27 种子推导的命中集合（design D6）：SWIMMING→COASTAL/LAKE。
// 注意桂林=MOUNTAIN,LAKE、无锡=LAKE、西宁/银川=LAKE,GRASSLAND 均含 LAKE。
const swimmingHits = [
  "珠海市", "三亚市", "青岛市", "厦门市", "大连市", "海口市", "北海市", "深圳市",
  "宁波市", "温州市", "泉州市", "烟台市", "威海市", "秦皇岛市", "舟山市", "桂林市",
  "杭州市", "苏州市", "无锡市", "武汉市", "昆明市", "大理白族自治州", "西宁市", "银川市",
];

async function cardNames(page: Page): Promise<string[]> {
  // 新版城市卡片标题为 h2（无 card-title slot）；政策侧栏 h2 不在卡片内，不受影响。
  return page.locator('[data-slot="card"] h2').allTextContents();
}

// 排序断言用相对位次而非绝对索引（atdd-design §4 确定性）：命中城市整体先于未命中；
// 同分维持服务端名称升序（SQLite BINARY 码位序，非拼音）；城市名均为 BMP 字符，
// UTF-16 码元比较与 UTF-8 字节序一致，不依赖浏览器 ICU 排序。
const byServerNameOrder = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// main 合入城市分页（PAGE_SIZE=9）：排序/徽标断言需遍历全部页累计；
// 翻页以「第 X / Y 页」指示文本变化为准，避免读到旧 DOM（allTextContents 无重试）。
const pageIndicator = (page: Page) => page.locator('nav[aria-label="城市分页"] p');

async function advancePage(page: Page): Promise<boolean> {
  const next = page.getByRole("button", { name: "下一页" });
  if ((await next.count()) === 0 || (await next.isDisabled())) return false;
  const before = await pageIndicator(page).textContent();
  await next.click();
  await expect(pageIndicator(page)).not.toHaveText(before ?? "");
  return true;
}

async function gotoFirstPage(page: Page) {
  const prev = page.getByRole("button", { name: "上一页" });
  while ((await prev.count()) > 0 && (await prev.isEnabled())) {
    const before = await pageIndicator(page).textContent();
    await prev.click();
    await expect(pageIndicator(page)).not.toHaveText(before ?? "");
  }
}

async function forEachPage(page: Page, visit: () => Promise<void>) {
  await gotoFirstPage(page);
  do {
    await visit();
  } while (await advancePage(page));
}

async function allCardNames(page: Page): Promise<string[]> {
  const names: string[] = [];
  await forEachPage(page, async () => {
    names.push(...(await cardNames(page)));
  });
  return names;
}

// 分页后目标城市可能在任意页：逐页查找，返回时停留于该城市所在页。
async function gotoCityCard(page: Page, name: string) {
  await gotoFirstPage(page);
  do {
    if ((await cityCard(page, name).count()) > 0) return cityCard(page, name);
  } while (await advancePage(page));
  return cityCard(page, name);
}

async function expectRecommendedOrder(page: Page, hits: string[]) {
  const names = await allCardNames(page);
  const hitSet = new Set(hits);
  const hitNames = names.filter((name) => hitSet.has(name));
  const restNames = names.filter((name) => !hitSet.has(name));
  expect(hitNames.length).toBeGreaterThan(0);
  expect(restNames.length).toBeGreaterThan(0);
  expect(hitNames).toEqual([...hitNames].sort(byServerNameOrder));
  expect(restNames).toEqual([...restNames].sort(byServerNameOrder));
  const lastHit = names.lastIndexOf(hitNames[hitNames.length - 1]);
  const firstRest = names.indexOf(restNames[0]);
  expect(lastHit).toBeLessThan(firstRest);
}

async function expectBadgesExactlyOn(page: Page, hits: string[]) {
  const badgeTitles: string[] = [];
  let badgeCount = 0;
  await forEachPage(page, async () => {
    const cards = page.locator('[data-slot="card"]');
    const badgeCards = cards.filter({ has: page.locator('[data-slot="badge"]') });
    badgeTitles.push(...(await badgeCards.locator("h2").allTextContents()));
    const badges = cards.locator('[data-slot="badge"]');
    badgeCount += await badges.count();
    const texts = await badges.allTextContents();
    expect(texts.every((text) => text === "系统推荐")).toBe(true);
    const labels = await badges.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")),
    );
    expect(labels.every((label) => label === "系统推荐")).toBe(true);
  });
  expect([...badgeTitles].sort()).toEqual([...hits].sort());
  expect(badgeCount).toBe(hits.length);
}

async function createPetViaApi(
  page: Page,
  input: {
    name: string;
    petType?: "CAT" | "DOG";
    preferences?: string[];
    personality?: string | null;
    omitPreferenceFields?: boolean;
    dogBreedId?: number | null;
  },
) {
  const headers = await csrfHeaders(page);
  const data: Record<string, unknown> = {
    name: input.name,
    petType: input.petType ?? "CAT",
    weightKg: 4,
    shoulderHeightCm: 25,
    hasLeash: true,
    hasVaccinationProof: true,
    photo: null,
    dogBreedId: input.dogBreedId ?? null,
  };
  if (!input.omitPreferenceFields) {
    data.preferences = input.preferences ?? [];
    data.personality = input.personality ?? null;
  }
  const response = await page.request.post("/api/pets", { headers, data });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: number };
}

async function deleteAllPetsViaApi(page: Page) {
  const headers = await csrfHeaders(page);
  const response = await page.request.get("/api/pets");
  const pets = (await response.json()) as { id: number }[];
  for (const pet of pets) {
    await page.request.delete(`/api/pets/${pet.id}`, { headers });
  }
}

type SeedPetRow = {
  id: number;
  user_id: number;
  name: string;
  pet_type: string;
  weight_kg: number;
  shoulder_height_cm: number;
  has_leash: number;
  has_vaccination_proof: number;
  photo: Uint8Array | null;
  dog_breed_id: number | null;
  preferences: string | null;
  personality: string | null;
};

let seedPets: SeedPetRow[] = [];

test.beforeAll(async () => {
  const dbPath = process.env.PAWTRIP_E2E_DB_PATH;
  if (!dbPath) return;
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA busy_timeout = 10000");
    seedPets = db
      .prepare(
        `SELECT p.* FROM pet p JOIN app_user u ON u.id = p.user_id WHERE u.username = ? ORDER BY p.id`,
      )
      .all(workerUsername()) as SeedPetRow[];
  } finally {
    db.close();
  }
});

test.afterAll(async () => {
  const dbPath = process.env.PAWTRIP_E2E_DB_PATH;
  if (!dbPath || seedPets.length === 0) return;
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA busy_timeout = 10000");
    db.exec("BEGIN");
    db.prepare(
      `DELETE FROM pet WHERE user_id = (SELECT id FROM app_user WHERE username = ?)`,
    ).run(workerUsername());
    const insert = db.prepare(
      `INSERT INTO pet (id, user_id, name, pet_type, weight_kg, shoulder_height_cm,
        has_leash, has_vaccination_proof, photo, dog_breed_id, preferences, personality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const pet of seedPets) {
      insert.run(
        pet.id, pet.user_id, pet.name, pet.pet_type, pet.weight_kg, pet.shoulder_height_cm,
        pet.has_leash, pet.has_vaccination_proof, pet.photo, pet.dog_breed_id,
        pet.preferences, pet.personality,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
});

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
  await deleteAllPetsViaApi(page);
});

test.afterEach(async ({ page }) => {
  await deleteAllPetsViaApi(page);
});

test("preference SWIMMING ranks coastal/lake cities first with badges and name-order ties", async ({
  page,
}) => {
  await createPetViaApi(page, { name: "泳泳", preferences: ["SWIMMING"] });
  await openCities(page);

  await expectRecommendedOrder(page, swimmingHits);
  await expectBadgesExactlyOn(page, swimmingHits);
  // 未命中城市（如广州，码位序本应靠前）被压后且无徽标；北京仅省级种子，不在候选内
  const names = await allCardNames(page);
  expect(names.indexOf("珠海市")).toBeLessThan(names.indexOf("广州市"));
});

test("badge contract: no reason text, coexists with policy tags, no recommendation toggle", async ({
  page,
}) => {
  await createPetViaApi(page, { name: "泳泳", preferences: ["SWIMMING"] });
  await openCities(page);

  const recommended = await gotoCityCard(page, "杭州市");
  await expect(recommended.locator('[data-slot="badge"]')).toHaveText("系统推荐");
  // 徽标不遮挡标题，且与逐宠物政策标签并存
  await expect(recommended.locator("h2")).toHaveText("杭州市");
  await expect(recommended.getByText(/泳泳 ·/).first()).toBeVisible();
  // 无理由文字（Non-goal 反向）
  await expect(page.getByText(/推荐原因|因为|推荐理由/)).toHaveCount(0);
  const plain = await gotoCityCard(page, "广州市");
  await expect(plain.locator('[data-slot="badge"]')).toHaveCount(0);
  // /cities 无推荐开关：仅「宠物友好筛选」一个复选框，无 switch 控件
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "宠物友好筛选" })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
});

test("filter and search overlay keeps score order and syncs candidate count", async ({ page }) => {
  await createPetViaApi(page, { name: "泳泳", preferences: ["SWIMMING"] });
  await openCities(page);

  const countText = await page.getByText(/共 \d+ 个候选/).textContent();
  const total = Number(countText?.match(/共 (\d+) 个候选/)?.[1] ?? NaN);
  await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
  await expectRecommendedOrder(page, swimmingHits);

  await page.getByRole("textbox", { name: "搜索城市" }).fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  const hangzhou = cityCard(page, "杭州市");
  await expect(hangzhou.locator('[data-slot="badge"]')).toHaveText("系统推荐");
  await expect(hangzhou.getByText(/泳泳 ·/).first()).toBeVisible();
  // 选定流程不变
  await hangzhou.getByRole("button", { name: "Pick" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
});


// REQ-014 修订（2026-11-17）：徽标 = 得分 >0 且首宠政策判定非「明确违反」（matchCityCandidate：
// friendly/unjudgeable 均展示，仅 unfriendly 隐藏）；政策判定仅影响徽标，排序位次不变。
// 种子口径：V16 全城 CAT,DOG + 7 个允许犬种（含柯基犬，不含德国牧羊犬），肩高上限均 NULL。
