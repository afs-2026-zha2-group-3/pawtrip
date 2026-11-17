import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  csrfHeaders,
  openCities,
  resetTrips,
  signIn,
  workerUsername,
} from "./trip-helpers";

// REQ-014 城市个性化推荐（atdd-design §2 E2E 表）。
// 账号策略：沿用 worker 账号（与 destination-selection 同槽位串行），避免与 paws（demo）并发冲突；
// 造数走 POST /api/pets、清理走 DELETE（不 mock 档案接口）；种子宠物（豆豆/毛毛，新列 NULL）
// 经 PAWTRIP_E2E_DB_PATH 直连临时库在 beforeAll/afterAll 精确快照/恢复（毛毛无品种，API 无法等价重建），
// 保证同 worker 后续套件（destination-selection E4 等）不受污染。直连先例见 city-pet-policy.spec.ts。

// V27 种子推导的命中集合（design D6）：SWIMMING→COASTAL/LAKE；CALM→LAKE/CITY_PARK
const swimmingHits = [
  "珠海市", "三亚市", "青岛市", "厦门市", "大连市", "海口市", "北海市", "深圳市",
  "宁波市", "温州市", "泉州市", "烟台市", "威海市", "秦皇岛市", "舟山市",
  "杭州市", "苏州市", "无锡市", "武汉市", "昆明市", "大理白族自治州", "西宁市", "银川市",
];
const calmHits = [
  "厦门市", "深圳市", "杭州市", "苏州市", "武汉市", "昆明市", "成都市", "南京市",
  "福州市", "长沙市", "广州市", "西安市", "哈尔滨市", "沈阳市", "大理白族自治州",
];

async function cardNames(page: Page): Promise<string[]> {
  return page.locator('[data-slot="card"] [data-slot="card-title"]').allTextContents();
}

// 排序断言用相对位次而非绝对索引（atdd-design §4 确定性）：命中城市整体先于未命中，组内保持名称升序
async function expectRecommendedOrder(page: Page, hits: string[]) {
  const names = await cardNames(page);
  const hitSet = new Set(hits);
  const hitNames = names.filter((name) => hitSet.has(name));
  const restNames = names.filter((name) => !hitSet.has(name));
  expect(hitNames.length).toBeGreaterThan(0);
  expect(restNames.length).toBeGreaterThan(0);
  expect(hitNames).toEqual([...hitNames].sort((a, b) => a.localeCompare(b, "zh-Hans-CN")));
  expect(restNames).toEqual([...restNames].sort((a, b) => a.localeCompare(b, "zh-Hans-CN")));
  const lastHit = names.lastIndexOf(hitNames[hitNames.length - 1]);
  const firstRest = names.indexOf(restNames[0]);
  expect(lastHit).toBeLessThan(firstRest);
}

async function expectNameOrderWithoutBadges(page: Page) {
  const names = await cardNames(page);
  expect(names.length).toBeGreaterThan(2);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "zh-Hans-CN")));
  await expect(page.locator('[data-slot="badge"]')).toHaveCount(0);
}

async function expectBadgesExactlyOn(page: Page, hits: string[]) {
  const cards = page.locator('[data-slot="card"]');
  const badgeCards = cards.filter({ has: page.locator('[data-slot="badge"]') });
  const badgeTitles = await badgeCards.locator('[data-slot="card-title"]').allTextContents();
  expect([...badgeTitles].sort()).toEqual([...hits].sort());
  const badges = cards.locator('[data-slot="badge"]');
  await expect(badges).toHaveCount(hits.length);
  const texts = await badges.allTextContents();
  expect(texts.every((text) => text === "系统推荐")).toBe(true);
  const labels = await badges.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
  expect(labels.every((label) => label === "系统推荐")).toBe(true);
}

async function createPetViaApi(
  page: Page,
  input: {
    name: string;
    petType?: "CAT" | "DOG";
    preferences?: string[];
    personality?: string | null;
    omitPreferenceFields?: boolean;
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
    dogBreedId: null,
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
  // 未命中城市（如北京，名称序本应靠前）被压后且无徽标
  const names = await cardNames(page);
  expect(names.indexOf("珠海市")).toBeLessThan(names.indexOf("北京市"));
});

test("personality CALM alone boosts lake/park cities without preferences", async ({ page }) => {
  await createPetViaApi(page, { name: "静静", preferences: [], personality: "CALM" });
  await openCities(page);

  await expectRecommendedOrder(page, calmHits);
  await expectBadgesExactlyOn(page, calmHits);
});

test("badge contract: no reason text, coexists with policy tags, no recommendation toggle", async ({
  page,
}) => {
  await createPetViaApi(page, { name: "泳泳", preferences: ["SWIMMING"] });
  await openCities(page);

  const recommended = cityCard(page, "杭州市");
  await expect(recommended.locator('[data-slot="badge"]')).toHaveText("系统推荐");
  // 徽标不遮挡标题，且与逐宠物政策标签并存
  await expect(recommended.locator('[data-slot="card-title"]')).toHaveText("杭州市");
  await expect(recommended.getByText(/泳泳 ·/).first()).toBeVisible();
  // 无理由文字（Non-goal 反向）
  await expect(page.getByText(/推荐原因|因为|推荐理由/)).toHaveCount(0);
  const plain = cityCard(page, "北京市");
  await expect(plain.locator('[data-slot="badge"]')).toHaveCount(0);
  // /cities 无推荐开关：仅「宠物友好筛选」一个复选框，无 switch 控件
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "宠物友好筛选" })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
});

test("unfilled preferences or no pet keeps name order without badges", async ({ page }) => {
  await createPetViaApi(page, { name: "空白", preferences: [], personality: null });
  await openCities(page);
  await expectNameOrderWithoutBadges(page);

  await deleteAllPetsViaApi(page);
  await page.reload();
  await expect(page.getByText(/共 \d+ 个候选/)).toBeVisible();
  await expectNameOrderWithoutBadges(page);
  await expect(page.getByText(/尚未添加宠物档案/)).toBeVisible();
});

test("multi-pet scoring uses only the first pet", async ({ page }) => {
  await createPetViaApi(page, { name: "泳泳", preferences: ["SWIMMING"] });
  await createPetViaApi(page, { name: "雪雪", preferences: ["SNOW_PLAY"] });
  await openCities(page);

  // 第二只 SNOW_PLAY 不抬升雪景城市：命中集合仍为首只 SWIMMING 的海滨/湖泊
  await expectRecommendedOrder(page, swimmingHits);
  await expectBadgesExactlyOn(page, swimmingHits);
  const names = await cardNames(page);
  expect(names.indexOf("珠海市")).toBeLessThan(names.indexOf("哈尔滨市"));
  await expect(cityCard(page, "哈尔滨市").locator('[data-slot="badge"]')).toHaveCount(0);
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
  await hangzhou.getByRole("button", { name: "选定" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
});

test("legacy pet without preference fields stays unset and unranked", async ({ page }) => {
  await createPetViaApi(page, { name: "旧档", omitPreferenceFields: true });

  await page.getByRole("tab", { name: "Paws" }).click();
  await page.getByRole("button", { name: "旧档（猫）" }).click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByText("未设置", { exact: true })).toHaveCount(2);
  await detail.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(detail).toHaveCount(0);

  await openCities(page);
  await expectNameOrderWithoutBadges(page);
});