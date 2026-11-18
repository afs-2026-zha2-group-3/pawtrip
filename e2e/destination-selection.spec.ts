import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  confirmTripDialog,
  createTrip,
  openCities,
  openTripDialog,
  pickCalendarDate,
  resetTrips,
  searchCity,
  setTripDates,
  signIn,
} from "./trip-helpers";

async function guestCount(page: Page): Promise<number> {
  const text = await page.getByText(/共 \d+ 个候选/).textContent();
  return Number(text?.match(/共 (\d+) 个候选/)?.[1] ?? NaN);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("E1 shows city candidates with 我的行程 tab and without duration input", async ({ page }) => {
  await openCities(page);

  expect(await guestCount(page)).toBeGreaterThan(2);
  await expect(page.getByTestId("city-card")).toHaveCount(9);
  await expect(page.getByRole("navigation", { name: "城市分页" })).toBeVisible();
  await expect(page.getByText(/第 1 \/ \d+ 页/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "我的行程" })).toBeVisible();
  await expect(page.getByText("旅游总天数")).toHaveCount(0);
  await expect(page.locator("header").getByText("目的地未选")).toHaveCount(0);
});

test("E2 searches by city or province keyword and shows empty state", async ({ page }) => {
  await openCities(page);

  const search = page.getByRole("textbox", { name: "搜索城市" });
  await search.fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toHaveCount(0);

  await search.fill("广东");
  await expect(page.getByTestId("city-card")).toHaveCount(9);
  await expect(cityCard(page, "杭州市")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "城市分页" })).toContainText(
    "第 1 / 3 页",
  );

  await search.fill("不存在的城市");
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

test("E3 pet-friendly filter keeps eligible candidates", async ({ page }) => {
  await openCities(page);
  await searchCity(page, "杭州");

  const total = await guestCount(page);
  const filter = page.getByRole("checkbox", { name: "宠物友好筛选" });
  await filter.click();
  await expect(filter).toBeChecked();
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
});

test("E4 candidate cards show one tag per pet", async ({ page }) => {
  await openCities(page);
  await searchCity(page, "杭州");

  const card = cityCard(page, "杭州市");
  await expect(card.getByText("豆豆 · 友好")).toBeVisible();
  await expect(card.getByText("毛毛 · 无法判定")).toBeVisible();
});

test("E5 selecting a city opens the trip dialog without POSTing a trip", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/trips"
    ) {
      posts.push(request.url());
    }
  });

  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");
  const calendar = dialog.locator('[data-slot="calendar-range"]');
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('[data-date][aria-pressed="true"]')).toHaveCount(0);

  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "搜索城市" })).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("E6 confirming the dialog creates a trip and opens attraction browsing", async ({ page }) => {
  await openCities(page);
  await openTripDialog(page, "珠海市");
  await setTripDates(page, 3);
  await confirmTripDialog(page);

  await expect(page.getByRole("heading", { name: "珠海市地点" })).toBeVisible();
  const panel = page.getByTestId("trip-panel");
  await expect(panel).toContainText("珠海市");
  await expect(panel).toContainText("3 天");

  const activeTripId = await page.evaluate(() =>
    window.localStorage.getItem("pawtrip.activeTripId"),
  );
  expect(activeTripId).not.toBeNull();

  await page.reload();
  await expect(page.getByRole("heading", { name: "珠海市地点" })).toBeVisible();
  await expect(page.getByTestId("trip-panel")).toContainText("3 天");
});

test("E7 rejects incomplete or overlong date ranges without creating a trip", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/trips"
    ) {
      posts.push(request.url());
    }
  });

  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");

  await pickCalendarDate(page, "2026-12-01");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("请选择开始和结束日期");

  await pickCalendarDate(page, "2026-12-08");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("行程需为 1–7 天");

  await expect(dialog).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("E8 city cards expose policy inline without policy links", async ({ page }) => {
  await openCities(page);
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await page.getByText("共 1 个候选").waitFor();

  const card = cityCard(page, "珠海市");
  await expect(
    card.getByRole("link", { name: /查看.*的城市政策/ }),
  ).toHaveCount(0);
  await expect(page.getByText("政策要点")).toHaveCount(0);
  await card.click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(
    page.getByRole("heading", { name: "珠海市宠物管理政策" }),
  ).toBeVisible();
  await expect(page.getByText("政策要点")).toBeVisible();
});

test("E9 active trip keeps candidates but blocks selecting another city", async ({
  page,
}) => {
  await createTrip(page, { city: "杭州市", days: 2 });
  await openCities(page);
  await searchCity(page, "杭州");

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toBeVisible();
  await expect(page.getByText("当前已有激活行程")).toBeVisible();
  const card = cityCard(page, "杭州市");
  await expect(card.getByRole("button", { name: "Pick" })).toBeDisabled();
  await expect(
    card.getByRole("link", { name: /查看.*的城市政策/ }),
  ).toHaveCount(0);
  await card.click();
  await expect(
    page.getByRole("heading", { name: "杭州市宠物管理政策" }),
  ).toBeVisible();
});

test("E10 cleans legacy session storage keys on startup", async ({ page }) => {
  await page.evaluate(() => {
    window.sessionStorage.setItem("pawtrip.selectedDestination", "{}");
    window.sessionStorage.setItem("pawtrip.tripDuration", "3");
  });

  await page.reload();
  await expect(page.getByRole("tab", { name: "城市浏览" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        selected: window.sessionStorage.getItem("pawtrip.selectedDestination"),
        duration: window.sessionStorage.getItem("pawtrip.tripDuration"),
      })),
    )
    .toEqual({ selected: null, duration: null });
});

test("E11 keeps 我的行程 tab selected on direct access", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("tab", { name: "我的行程" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("E12 renders friendly and unfriendly tags per pet", async ({ page }) => {
  await page.route("**/api/pets", (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          name: "旺财",
          petType: "DOG",
          weightKg: 10,
          shoulderHeightCm: 35,
          hasLeash: true,
          hasVaccinationProof: true,
          photo: null,
          dogBreed: { id: 3, name: "柯基犬", officialAggressive: false },
        },
        {
          id: 2,
          name: "小白",
          petType: "DOG",
          weightKg: 10,
          shoulderHeightCm: 35,
          hasLeash: true,
          hasVaccinationProof: true,
          photo: null,
          dogBreed: { id: 9, name: "其他犬", officialAggressive: false },
        },
      ],
    }),
  );
  await page.route("**/api/destinations**", (route) =>
    route.fulfill({
      json: [
        {
          adcode: "330100",
          name: "杭州市",
          province: "浙江省",
          policyCovered: false,
          bannedBreeds: [],
          allowedPetTypes: "DOG",
          allowedDogBreedIds: [3],
          maxSinglePetShoulderHeightCm: null,
        },
      ],
    }),
  );

  await page.getByRole("tab", { name: "城市浏览" }).click();
  const card = cityCard(page, "杭州市");
  await expect(card.getByText("旺财 · 友好")).toBeVisible();
  await expect(card.getByText("小白 · 不友好")).toBeVisible();
});

test("E13 prompts for a pet profile when the user has none", async ({ page }) => {
  await page.route("**/api/pets", (route) => route.fulfill({ json: [] }));
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await searchCity(page, "杭州");

  await expect(page.getByText(/尚未添加宠物档案/)).toBeVisible();
  await expect(page.getByRole("link", { name: "先去添加宠物" })).toBeVisible();
  await expect(cityCard(page, "杭州市").getByText(/·/)).toHaveCount(0);
});

test("E14 reports a pet API failure instead of an empty pet list", async ({ page }) => {
  await page.route("**/api/pets", (route) =>
    route.fulfill({ status: 400, json: { status: 400 } }),
  );
  await page.getByRole("tab", { name: "城市浏览" }).click();

  await expect(page.getByText("暂时无法读取宠物档案，请稍后重试。")).toBeVisible();
  await expect(page.getByText(/尚未添加宠物档案/)).toHaveCount(0);
});

test("E15 selecting a city shows its policy in the sidebar", async ({ page }) => {
  await openCities(page);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByText("政策要点")).toHaveCount(0);

  await searchCity(page, "珠海");
  const card = cityCard(page, "珠海市");
  await expect(card.getByRole("link")).toHaveCount(0);
  await card.click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(
    panel.getByRole("heading", { name: "珠海市宠物管理政策" }),
  ).toBeVisible();
  await expect(panel.getByText("更新于 2025-07")).toBeVisible();
  await expect(panel.getByText("政策要点")).toBeVisible();
  await expect(panel.locator("li")).toHaveCount(3);
  await expect(panel).toContainText("严格管理区内禁止饲养危险犬");
  await expect(
    panel.getByText(/您的宠物豆豆不在珠海市禁养名单中/),
  ).toBeVisible();
  await expect(
    panel.getByText(/毛毛：宠物未填写犬种，无法判定禁养名单/),
  ).toBeVisible();
  await expect(
    panel.getByText("仍需遵守当地关于数量、牵引、疫苗等其他规定。").first(),
  ).toBeVisible();
  await expect(panel.getByText("禁养犬种名单")).toHaveCount(0);
  await expect(panel.getByText("可携带犬种")).toHaveCount(0);
  await expect(
    panel.getByRole("link", { name: "查看完整政策与来源" }),
  ).toBeVisible();

  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await card.focus();
  await page.keyboard.press("Space");
  await expect(panel).toBeVisible();

  await panel.getByRole("link", { name: "珠海市禁养犬名单" }).click();
  await expect(page).toHaveURL(
    /\/destinations\/440400\/policy#banned-breeds$/,
  );
  await expect(
    page.getByRole("heading", { name: "珠海市养宠政策" }),
  ).toBeVisible();
  await expect(page.getByText("禁养犬种名单").first()).toBeVisible();
  await expect(page.locator("#banned-breeds")).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(
    page.getByText("仅列出部分示例，完整名单请查阅当地政府通告。"),
  ).toBeVisible();
});

test("E16 paginates candidates and resets to the first page on search", async ({
  page,
}) => {
  await openCities(page);

  const pager = page.getByRole("navigation", { name: "城市分页" });
  await expect(pager).toContainText("第 1 /");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeDisabled();
  await expect(pager.getByRole("button", { name: "下一页" })).toBeEnabled();
  const total = await guestCount(page);
  const firstAdcode = await page
    .getByTestId("city-card")
    .first()
    .getAttribute("data-adcode");

  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 2 /");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeEnabled();
  await expect(page.getByTestId("city-card").first()).not.toHaveAttribute(
    "data-adcode",
    firstAdcode ?? "",
  );
  expect(await guestCount(page)).toBe(total);

  await page.getByRole("textbox", { name: "搜索城市" }).fill("广东");
  await expect(pager).toContainText("第 1 / 3 页");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeDisabled();

  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 2 / 3 页");
  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 3 / 3 页");
  await expect(pager.getByRole("button", { name: "下一页" })).toBeDisabled();

  await searchCity(page, "杭州");
  await expect(pager).toHaveCount(0);
  await expect(cityCard(page, "杭州市")).toBeVisible();
});

test("E17 shows public policy for first-page cities", async ({ page }) => {
  await openCities(page);

  const cards = page.getByTestId("city-card");
  const count = await cards.count();
  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  let covered = 0;
  let withDetailLink = 0;

  for (let index = 0; index < count; index += 1) {
    const name = (await cards.nth(index).locator("h2").textContent()) ?? "";
    await cards.nth(index).click();
    await panel
      .getByRole("heading", { name: `${name}宠物管理政策` })
      .waitFor({ timeout: 2500 });
    const shown = await panel
      .getByText("政策要点")
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (shown) {
      covered += 1;
      const linkShown = await panel
        .getByRole("link", { name: "查看完整政策与来源" })
        .isVisible()
        .catch(() => false);
      if (linkShown) withDetailLink += 1;
    }
  }

  expect(covered).toBeGreaterThanOrEqual(8);
  expect(withDetailLink).toBe(covered);
  await expect(page.getByText("演示数据")).toHaveCount(0);

  await searchCity(page, "三沙");
  await cityCard(page, "三沙市").click();
  await expect(panel.getByText("暂无当地政策数据")).toBeVisible();
  await expect(
    panel.getByText(/当前仅覆盖已录入政策的城市/),
  ).toBeVisible();
  await expect(panel.getByText("政策要点")).toHaveCount(0);
});

test("E18 closes the sidebar policy panel", async ({ page }) => {
  await openCities(page);
  await searchCity(page, "珠海");
  await cityCard(page, "珠海市").click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(panel.getByText("政策要点")).toBeVisible();

  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText("政策要点")).toHaveCount(0);
  await expect(cityCard(page, "珠海市")).toBeVisible();
});

test("E19 lists the mapped subset of Shangrao banned breeds", async ({
  page,
}) => {
  await openCities(page);
  await searchCity(page, "上饶");
  await cityCard(page, "上饶市").click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(
    panel.getByRole("link", { name: "上饶市禁养犬名单" }),
  ).toBeVisible();
  await expect(panel.getByText("禁养犬种名单")).toHaveCount(0);
  await panel.getByRole("link", { name: "上饶市禁养犬名单" }).click();

  await expect(page).toHaveURL(/\/destinations\/361100\/policy#banned-breeds$/);
  await expect(page.locator("#banned-breeds")).toBeInViewport();
  await expect(page.getByText(/来源与时效/)).toBeVisible();
  await expect(
    page.getByText(/上饶市养犬管理暂行规定/).first(),
  ).toBeVisible();
  for (const breed of [
    "比特犬",
    "藏獒",
    "德国牧羊犬",
    "罗威纳犬",
    "杜宾犬",
    "秋田犬",
  ]) {
    await expect(page.getByText(breed, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("等 8 种")).toBeVisible();
  await expect(
    page.getByText("仅列出部分示例，完整名单请查阅当地政府通告。"),
  ).toBeVisible();

  const response = await page.request.get("/api/cities/361100/pet-policy");
  expect(response.ok()).toBeTruthy();
  const policy = (await response.json()) as { bannedBreeds: string[] };
  expect(policy.bannedBreeds).toHaveLength(8);
  for (const breed of [
    "比特犬",
    "藏獒",
    "德国牧羊犬",
    "罗威纳犬",
    "杜宾犬",
    "秋田犬",
    "高加索犬",
    "卡斯罗犬",
  ]) {
    expect(policy.bannedBreeds).toContain(breed);
  }
});

test("E20 preserves card width on wide screens and stacks on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await openCities(page);
  await searchCity(page, "珠海");

  const card = cityCard(page, "珠海市");
  const before = await card.boundingBox();
  await card.click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(panel.getByText("政策要点")).toBeVisible();
  const after = await card.boundingBox();
  expect(
    Math.abs((after?.width ?? 0) - (before?.width ?? 0)),
  ).toBeLessThanOrEqual(1);

  const panelBox = await panel.boundingBox();
  expect(panelBox?.x ?? 0).toBeGreaterThanOrEqual(
    (before?.x ?? 0) + (before?.width ?? 0),
  );
  await expect(page.locator("main")).toHaveClass(/max-w-\[1408px\]/);

  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator("main")).toHaveClass(/max-w-5xl/);
  await expect(card).toBeVisible();

  await page.setViewportSize({ width: 1200, height: 900 });
  await card.click();
  await expect(panel).toBeVisible();
  const narrowCard = await card.boundingBox();
  const narrowPanel = await panel.boundingBox();
  expect(narrowPanel?.y ?? 0).toBeGreaterThanOrEqual(
    (narrowCard?.y ?? 0) + (narrowCard?.height ?? 0),
  );
});

test("E21 shows friendly and unfriendly verdicts per pet in the sidebar", async ({
  page,
}) => {
  await page.route("**/api/pets", (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          name: "旺财",
          petType: "DOG",
          weightKg: 10,
          shoulderHeightCm: 35,
          hasLeash: true,
          hasVaccinationProof: true,
          photo: null,
          dogBreed: { id: 10, name: "柯基犬", officialAggressive: false },
        },
        {
          id: 2,
          name: "小白",
          petType: "DOG",
          weightKg: 10,
          shoulderHeightCm: 35,
          hasLeash: true,
          hasVaccinationProof: true,
          photo: null,
          dogBreed: { id: 18, name: "比特犬", officialAggressive: true },
        },
      ],
    }),
  );

  await openCities(page);
  await searchCity(page, "珠海");
  await cityCard(page, "珠海市").click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(
    panel.getByText("您的宠物旺财不在珠海市禁养名单中。"),
  ).toBeVisible();
  await expect(
    panel.getByText(/小白：比特犬属于当地禁养犬种/).first(),
  ).toBeVisible();
  await expect(
    panel.getByText("仍需遵守当地关于数量、牵引、疫苗等其他规定。"),
  ).toHaveCount(0);
});
