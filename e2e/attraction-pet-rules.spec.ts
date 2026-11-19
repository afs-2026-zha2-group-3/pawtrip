import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  createActiveTripViaApi,
  createTrip,
  openCities,
  resetTrips,
  searchCity,
  signIn,
} from "./trip-helpers";

const cityAdcodes: Record<string, string> = {
  珠海市: "440400",
  广州市: "440100",
  南京市: "320100",
  杭州市: "330100",
};

function attractionCard(page: Page, name: string) {
  return page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: name }),
  });
}

function locationCardGrid(page: Page) {
  return attractionCard(page, "情侣路").locator("xpath=..");
}

// 珠海夹具共 7 个景点：5 个基础夹具 + day-route 的 2 个路线夹具。
const zhuHaiAttractionCardCount = 7;

async function choosePlaceType(page: Page, label: "景点" | "酒店" | "餐厅") {
  await page.getByRole("combobox", { name: "地点选择" }).click();
  await page
    .getByRole("option", { name: label === "景点" ? "景点" : "酒店和餐厅", exact: true })
    .click();
  if (label !== "景点") {
    await page.getByRole("tab", { name: label, exact: true }).click();
  }
}

async function chooseTypeTag(page: Page, label: "酒店" | "餐厅") {
  await page.getByRole("tab", { name: label, exact: true }).click();
}

async function openAttractions(page: Page) {
  await choosePlaceType(page, "景点");
  await expect(page).toHaveURL(/\/attractions$/);
}

async function hideTripPanel(page: Page) {
  await page.getByTestId("trip-panel").evaluate((panel) => {
    (panel as HTMLElement).style.display = "none";
  });
}

async function showTripPanel(page: Page) {
  await page.getByTestId("trip-panel").evaluate((panel) => {
    (panel as HTMLElement).style.display = "";
  });
}

async function tripTo(page: Page, city: string) {
  const cityAdcode = cityAdcodes[city];
  if (!cityAdcode) throw new Error(`Unknown city fixture: ${city}`);
  await createActiveTripViaApi(page, { cityAdcode, petName: "豆豆" });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);
  // 双列布局下固定的行程面板会遮挡左列卡片底部按钮；本套件专注列表/详情行为。
  await hideTripPanel(page);
}

async function scheduleAttractionAndSelectAnchor(
  page: Page,
  name: string,
  addFeedback?: { mood: "warn" | "ok"; text: string },
) {
  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  await attractionCard(page, name).getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await put;
  if (addFeedback) {
    const bubble = page.getByTestId("companion-bubble");
    await expect(bubble).toHaveAttribute("data-mood", addFeedback.mood, {
      timeout: 3000,
    });
    await expect(bubble).toContainText(addFeedback.text);
  }

  await choosePlaceType(page, "酒店");
  await expect(page).toHaveURL(/\/attractions\?type=hotel$/);
  const anchor = page.getByRole("combobox", { name: "离景点最近" });
  await expect(anchor).toBeEnabled();
  await anchor.click();
  await page.getByRole("option", { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await interceptMediaPhotos(page);
  await signIn(page);
  await resetTrips(page);
});

test("E1 trip city shows pet-friendly attractions", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toBeVisible();
  await expect(attractionCard(page, "情侣路").getByText("宠物友好")).toBeVisible();
  await expect(attractionCard(page, "珠海渔女")).toHaveCount(0);
  await expect(attractionCard(page, "珠海海滨公园")).toHaveCount(0);
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
  await expect(page.getByTestId("trip-panel-column")).toHaveCSS(
    "border-top-color",
    "rgb(255, 239, 214)",
  );
  await expect(page.getByTestId("attractions-region")).toHaveCSS(
    "border-top-color",
    "rgb(255, 239, 214)",
  );
});

test.describe("agent panel layout integration", () => {
  test.use({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: "reduce",
  });

  test("collapsed agent panel shows three card columns and an inset map", async ({
    page,
  }) => {
    await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
    await page.goto("/attractions");
    await expect(page).toHaveURL(/\/attractions$/);
    await showAllAttractions(page);

    const grid = locationCardGrid(page);
    const cards = grid.locator('[data-slot="card"]');
    await expect(cards).toHaveCount(zhuHaiAttractionCardCount);

    const [first, second, third] = await Promise.all([
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox(),
      cards.nth(2).boundingBox(),
    ]);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
    expect(Math.abs(first!.y - third!.y)).toBeLessThanOrEqual(1);
    expect(third!.x).toBeGreaterThan(second!.x + second!.width - 1);

    await expect(page.getByTestId("ai-chatbox-slot")).toHaveCount(0);

    const layout = await page.getByTestId("attractions-layout").boundingBox();
    const map = await page.getByTestId("location-map-placeholder").boundingBox();
    expect(layout).not.toBeNull();
    expect(map).not.toBeNull();
    // 地图在外框内保留上下与右侧间距，右缘不与外框贴齐。
    const inset = 12;
    expect(layout!.x + layout!.width - (map!.x + map!.width)).toBeGreaterThanOrEqual(inset - 1);
    expect(map!.y - layout!.y).toBeGreaterThanOrEqual(inset - 1);
    expect(layout!.y + layout!.height - (map!.y + map!.height)).toBeGreaterThanOrEqual(inset - 1);
  });

  test("expanded agent panel keeps two card columns and leaves map space", async ({
    page,
  }) => {
    await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
    await page.goto("/attractions");
    await expect(page).toHaveURL(/\/attractions$/);
    await showAllAttractions(page);

    const cards = locationCardGrid(page).locator('[data-slot="card"]');
    await expect(cards).toHaveCount(zhuHaiAttractionCardCount);

    await page.getByTestId("agent-fab").click();
    await expect(page.getByTestId("agent-panel")).toBeVisible();

    const [first, second, third] = await Promise.all([
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox(),
      cards.nth(2).boundingBox(),
    ]);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
    expect(Math.abs(first!.y - second!.y)).toBeLessThanOrEqual(1);
    expect(third!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 1);

    const map = await page.getByTestId("location-map-placeholder").boundingBox();
    const panel = await page.getByTestId("agent-panel").boundingBox();
    expect(map).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(map!.x + map!.width).toBeLessThanOrEqual(panel!.x - 8);
    await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toBeChecked();

    await page.getByRole("button", { name: "关闭 Agent 面板" }).click();
    await expect(page.getByTestId("agent-panel")).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toBeChecked();

    const layout = await page.getByTestId("attractions-layout").boundingBox();
    const restoredMap = await page.getByTestId("location-map-placeholder").boundingBox();
    const restoredThird = await cards.nth(2).boundingBox();
    expect(layout).not.toBeNull();
    expect(restoredMap).not.toBeNull();
    expect(restoredThird).not.toBeNull();
    expect(Math.abs(first!.y - restoredThird!.y)).toBeLessThanOrEqual(1);
    expect(
      layout!.x + layout!.width - (restoredMap!.x + restoredMap!.width),
    ).toBeGreaterThanOrEqual(11);
  });
});

test.describe("below the 2xl breakpoint", () => {
  test.use({ reducedMotion: "reduce" });

});
test("E2 toggles all saved attractions and shows forbidden/unconfigured states", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await expect(attractionCard(page, "珠海渔女").getByText("禁止携带")).toBeVisible();
  await expect(
    attractionCard(page, "珠海海滨公园").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(
    attractionCard(page, "珠海无名景点").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E4 shows forbidden detail and empty policy detail", async ({ page }) => {
  await tripTo(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("禁止携带", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toBeChecked();

  await attractionCard(page, "珠海无名景点").getByRole("button", { name: "查看详情" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("未配置", { exact: true })).toBeVisible();
  await expect(dialog.getByText("暂无携宠政策")).toBeVisible();
});

test("E5 switching city clears the current trip", async ({ page }) => {
  await tripTo(page, "珠海市");
  await expect(attractionCard(page, "情侣路")).toBeVisible();

  await openCities(page);
  await searchCity(page, "杭州");
  const pick = cityCard(page, "杭州市").getByRole("button", { name: "选择" });
  await expect(pick).toBeEnabled();
  await pick.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("当前已有激活行程")).toHaveCount(0);
  await expect(
    page.getByText("pawtrip.activeTripId"),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBeNull();
  await page.getByRole("button", { name: "取消" }).click();
  await createTrip(page, { city: "杭州市", days: 1 });
  await openAttractions(page);

  await expect(attractionCard(page, "西湖")).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toHaveCount(0);
});

test("E7 selects no tab on attraction routes while the place select stays active", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  const placeSelect = page.getByRole("combobox", { name: "地点选择" });
  await expect(placeSelect).toHaveAttribute("data-active", "true");
  for (const name of ["首页", "我的宠物", "城市浏览", "交通规则", "我的行程"]) {
    await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "false");
  }

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/attractions$/);
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expect(placeSelect).toHaveAttribute("data-active", "true");

  await choosePlaceType(page, "酒店");
  await expect(page).toHaveURL(/\/attractions\?type=hotel$/);
  await expect(placeSelect).toHaveAttribute("data-active", "true");
  for (const name of ["首页", "我的宠物", "城市浏览", "交通规则", "我的行程"]) {
    await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "false");
  }
});

test("E1 nav dropdown switches to hotel and back to attractions", async ({ page }) => {
  await tripTo(page, "珠海市");
  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();

  await choosePlaceType(page, "酒店");
  await expect(page).toHaveURL(/\/attractions\?type=hotel$/);
  await expect(page.getByRole("heading", { name: "酒店", exact: true })).toBeVisible();
  await expect(attractionCard(page, "珠海某酒店")).toBeVisible();

  await page.getByRole("combobox", { name: "地点选择" }).click();
  const lodgingOption = page.getByRole("option", { name: "酒店和餐厅", exact: true });
  await expect(lodgingOption).toBeVisible();
  expect(await lodgingOption.evaluate((element) => element.hasAttribute("data-selected"))).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tab", { name: "酒店", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await chooseTypeTag(page, "餐厅");
  await expect(page).toHaveURL(/\/attractions\?type=restaurant$/);
  await expect(page.getByRole("heading", { name: "餐厅", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "餐厅", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await chooseTypeTag(page, "酒店");
  await expect(page).toHaveURL(/\/attractions\?type=hotel$/);

  await choosePlaceType(page, "景点");
  await expect(page).toHaveURL(/\/attractions$/);
  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toBeVisible();
});

test("E2 refresh keeps the place type", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
  await page.goto("/attractions?type=restaurant");
  await expect(page.getByRole("heading", { name: "餐厅", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "餐厅", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "地点选择" })).toBeVisible();
  await expect(attractionCard(page, "附近餐厅")).toBeVisible();
});

test("E4 illegal place type falls back to attractions", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
  await page.goto("/attractions?type=park");

  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("E13 switching place type resets pagination to page 1", async ({ page }) => {
  const locationRequests: URL[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/locations") {
      locationRequests.push(url);
    }
  });
  await page.route("**/api/locations?*", async (route) => {
    const url = new URL(route.request().url());
    const typeGroup = url.searchParams.get("typeGroup") ?? "attraction";
    const pageNo = Number(url.searchParams.get("page") ?? "1");
    await route.fulfill({
      json: {
        page: pageNo,
        pageSize: 20,
        totalElements: 21,
        totalPages: 2,
        hasNext: pageNo < 2,
        hasPrevious: pageNo > 1,
        items: [
          {
            poiId: `${typeGroup}-${pageNo}`,
            name: `${typeGroup} 第 ${pageNo} 页地点`,
            typeCode: "110000",
            typeGroup,
            address: "珠海市香洲区",
            description: null,
            longitude: null,
            latitude: null,
            regionCode: "440400",
            minVisitHours: null,
            maxVisitHours: null,
            maxPetsPerPerson: 1,
            petPolicies: {
              allowedPetTypes: "DOG",
              maxPetsPerPerson: 1,
              maxSinglePetWeightKg: null,
              maxSinglePetShoulderHeightCm: null,
              leashRequired: null,
              vaccinationProofRequired: null,
              extraFeeCents: null,
              reservationRequired: null,
            },
            coverPhotoUrl: null,
            rating: null,
            keytag: null,
            distanceMeters: null,
          },
        ],
      },
    });
  });
  await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
  await page.goto("/attractions");
  await hideTripPanel(page);

  await expect(page.getByText("第 1 / 2 页")).toBeVisible();
  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();

  await choosePlaceType(page, "酒店");
  await expect(page.getByRole("heading", { name: "酒店", exact: true })).toBeVisible();
  await expect(page.getByText("第 1 / 2 页")).toBeVisible();
  expect(
    locationRequests.some(
      (url) =>
        url.searchParams.get("typeGroup") === "hotel" && url.searchParams.get("page") === "1",
    ),
  ).toBe(true);
});

test("E14 in-page type controls are removed for every place type", async ({ page }) => {
  await tripTo(page, "珠海市");

  for (const label of ["景点", "酒店", "餐厅"] as const) {
    if (label !== "景点") {
      await choosePlaceType(page, label);
    }
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "地点类型筛选" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "返回景点选择" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "选择住宿/餐厅" })).toHaveCount(0);
  }
});

// --- REQ-013 地点卡片媒体（add-location-card-media，ATDD E1–E9） ---

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

async function interceptMediaPhotos(page: Page) {
  await page.route("https://photos.e2e.test/**", (route) => {
    if (new URL(route.request().url()).pathname === "/broken.png") {
      return route.abort();
    }
    return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1PX });
  });
}

async function showAllAttractions(page: Page) {
  const toggle = page.getByRole("checkbox", { name: "显示全部地点" });
  await toggle.click();
  await expect(toggle).toBeChecked();
}

async function selectType(
  page: Page,
  label: "景点" | "酒店" | "餐厅",
  addFeedback?: { mood: "warn" | "ok"; text: string },
) {
  if (label === "景点") {
    await openAttractions(page);
    return;
  }
  await scheduleAttractionAndSelectAnchor(page, "情侣路", addFeedback);
  if (label === "餐厅") {
    await choosePlaceType(page, "餐厅");
    await expect(page).toHaveURL(/\/attractions\?type=restaurant$/);
  }
}

test("media E1 card shows layered cover badges, description and compact day entry", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  const card = attractionCard(page, "情侣路");
  const cover = card.getByRole("img", { name: "情侣路", exact: true });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", "https://photos.e2e.test/a-0.png");
  await expect(cover).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect
    .poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const box = await cover.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width / box!.height).toBeCloseTo(4 / 3, 1);

  const friendly = card.getByText("宠物友好", { exact: true });
  await expect(friendly).toBeVisible();
  const keytag = card.getByText("滨海步道", { exact: true });
  await expect(keytag).toBeVisible();
  const rating = card.getByTestId("location-rating");
  await expect(rating).toBeVisible();
  await expect(rating).toContainText("4.6");

  for (const badge of [friendly, keytag, rating]) {
    const badgeBox = await badge.boundingBox();
    expect(badgeBox).not.toBeNull();
    expect(badgeBox!.x).toBeGreaterThanOrEqual(box!.x - 1);
    expect(badgeBox!.y).toBeGreaterThanOrEqual(box!.y - 1);
    expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
    expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
  }

  // 政策要求标签叠放在封面内，封面下方只保留宠物适住标签。
  const leashTag = card.getByText("公共区域需牵引", { exact: true });
  await expect(leashTag).toBeVisible();
  const leashBox = await leashTag.boundingBox();
  expect(leashBox).not.toBeNull();
  expect(leashBox!.x).toBeGreaterThanOrEqual(box!.x - 1);
  expect(leashBox!.y).toBeGreaterThanOrEqual(box!.y - 1);
  expect(leashBox!.x + leashBox!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
  expect(leashBox!.y + leashBox!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);

  const verdict = card.getByText(/^豆豆 · /).first();
  await expect(verdict).toBeVisible();
  const verdictBox = await verdict.boundingBox();
  expect(verdictBox).not.toBeNull();
  expect(verdictBox!.y).toBeGreaterThanOrEqual(box!.y + box!.height - 1);

  await expect(card).toContainText("沿着情侣路海滨步道慢慢走，和毛孩子一起吹吹海风。");
  await expect(card).not.toContainText("珠海市香洲区");

  const daySelect = card.getByRole("combobox", { name: "添加到行程" });
  await expect(daySelect).toContainText("请选择日期");
  await daySelect.click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await expect(daySelect).toContainText("第 1 天");
  await expect(card.getByRole("button", { name: "查看详情" })).toBeVisible();
});

test("media E1b card description falls back to address and placeholder", async ({ page }) => {
  await tripTo(page, "珠海市");
  await showAllAttractions(page);

  await expect(attractionCard(page, "无坐标景点")).toContainText("珠海市香洲区");

  const unnamed = attractionCard(page, "珠海无名景点");
  await expect(unnamed).toContainText("地址未收录");
  await expect(unnamed.getByText("获取图片")).toHaveCount(0);
});


test("media E5 only violated weight and shoulder limits render in red", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "毛毛" });
  await openAttractions(page);
  await hideTripPanel(page);

  const loverCard = attractionCard(page, "情侣路");
  await expect(loverCard.getByText("≤8.5 kg")).toHaveClass(/text-destructive/);
  await expect(loverCard.getByText("≤40 cm")).toHaveClass(/text-destructive/);
  await expect(loverCard.getByText(/附加费/)).toHaveCount(0);

  await selectType(page, "酒店", {
    mood: "warn",
    text: "把情侣路加进来啦，不过毛毛可能不满足",
  });
  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel.getByText("≤15 kg")).toHaveClass(/text-destructive/);
  await expect(hotel.getByText(/cm/)).toHaveCount(0);
  await expect(hotel.getByText(/附加费/)).toHaveCount(0);

  await selectType(page, "景点");
  await showAllAttractions(page);
  const emptyCard = attractionCard(page, "珠海渔女");
  await expect(emptyCard).toBeVisible();
  await expect(emptyCard.getByText(/≤|附加费/)).toHaveCount(0);
});

test("media E5b hides limit tags when the pet meets every cap", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(attractionCard(page, "情侣路").getByText(/≤|附加费/)).toHaveCount(0);

  await selectType(page, "酒店", {
    mood: "ok",
    text: "我把情侣路排进第 1 天啦",
  });
  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel.getByText(/≤|附加费/)).toHaveCount(0);

  const saved = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  await hotel.getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await saved;
  const bubble = page.getByTestId("companion-bubble");
  await expect(bubble).toHaveAttribute("data-mood", "ok", { timeout: 3000 });
  await expect(bubble).toContainText("我把珠海某酒店排进第 1 天啦");

  await selectType(page, "景点");
  await showAllAttractions(page);
  await expect(attractionCard(page, "珠海渔女").getByText(/≤|附加费/)).toHaveCount(0);
});

test("media E7 detail dialog carries cover, rating and description with fallback", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  const cover = dialog.getByRole("img", { name: "情侣路", exact: true });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", "https://photos.e2e.test/a-0.png");
  await expect(dialog.getByTestId("location-rating")).toContainText("4.6");
  await expect(dialog.getByText("8.5 kg")).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "添加到行程" })).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();

  await showAllAttractions(page);
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  await expect(dialog.getByRole("img", { name: "珠海渔女暂无图片" })).toBeVisible();
  await expect(dialog.getByTestId("location-rating")).toHaveCount(0);
  await expect(
    dialog.getByText("城市地标旁的滨海步道，适合和毛孩子一起看海。", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();

  await attractionCard(page, "珠海无名景点").getByRole("button", { name: "查看详情" }).click();
  await expect(dialog.getByText("地址未收录", { exact: true })).toBeVisible();
});
