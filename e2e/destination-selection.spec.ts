import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  confirmTripDialog,
  createTrip,
  openCities,
  openTripDialog,
  resetTrips,
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

test("E1 shows city candidates with Trips tab and without duration input", async ({ page }) => {
  await openCities(page);

  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
  expect(await guestCount(page)).toBeGreaterThan(2);
  await expect(page.getByRole("tab", { name: "Trips" })).toBeVisible();
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
  await expect(cityCard(page, "珠海市")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toHaveCount(0);

  await search.fill("不存在的城市");
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

test("E3 pet-friendly filter keeps eligible candidates", async ({ page }) => {
  await openCities(page);

  const total = await guestCount(page);
  const filter = page.getByRole("checkbox", { name: "宠物友好筛选" });
  await filter.click();
  await expect(filter).toBeChecked();
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
});

test("E4 candidate cards show one tag per pet", async ({ page }) => {
  await openCities(page);

  const card = cityCard(page, "杭州市");
  await expect(card.getByText("豆豆 · 无法判定")).toBeVisible();
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
  await expect(dialog.getByLabel("开始日期")).toHaveValue("");
  await expect(dialog.getByLabel("结束日期")).toHaveValue("");

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

test("E7 rejects invalid date ranges without creating a trip", async ({ page }) => {
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

  await dialog.getByLabel("开始日期").fill("2026-12-10");
  await dialog.getByLabel("结束日期").fill("2026-12-09");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("结束日期不能早于开始日期");

  await dialog.getByLabel("开始日期").fill("2026-12-01");
  await dialog.getByLabel("结束日期").fill("2026-12-08");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("行程需为 1–7 天");

  await expect(dialog).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("E8 city cards expose policy only through the policy link", async ({ page }) => {
  await openCities(page);

  const card = cityCard(page, "珠海市");
  await expect(
    card.getByRole("link", { name: "查看珠海市的城市政策" }),
  ).toBeVisible();
  await expect(page.getByText("政策要点")).toHaveCount(0);

  await card.getByRole("link", { name: "查看珠海市的城市政策" }).click();
  await expect(page).toHaveURL(/\/destinations\/440400\/policy$/);
  await expect(page.getByRole("heading", { name: "珠海市养宠政策" })).toBeVisible();
});

test("E9 active trip keeps candidates but blocks selecting another city", async ({
  page,
}) => {
  await createTrip(page, { city: "杭州市", days: 2 });
  await openCities(page);

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toBeVisible();
  await expect(page.getByText("当前已有激活行程")).toBeVisible();
  const card = cityCard(page, "杭州市");
  await expect(card.getByRole("button", { name: "选定" })).toBeDisabled();
  await expect(
    card.getByRole("link", { name: "查看杭州市的城市政策" }),
  ).toBeVisible();
  await expect(page.getByText("政策要点")).toHaveCount(0);
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

test("E11 keeps Trips tab selected on direct access", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("tab", { name: "Trips" })).toHaveAttribute(
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

test("E15 policy content stays on the policy page", async ({ page }) => {
  await openCities(page);

  await expect(
    page.getByRole("link", { name: /查看.*的城市政策/ }).first(),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /养犬政策/ })).toHaveCount(0);
  await expect(page.getByText("禁养犬种名单")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
});
