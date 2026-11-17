import { expect, test, type Page } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  pets,
  resetTrips,
  signIn,
} from "./trip-helpers";

const ZHUHAI = "440400";

async function openAgent(page: Page) {
  await page.getByTestId("agent-fab").click();
  await expect(page.getByTestId("agent-panel")).toBeVisible();
}

async function sendAgentMessage(page: Page, text: string) {
  await page.getByLabel("向行程规划助手提问").fill(text);
  await page.getByRole("button", { name: "发送" }).click();
}

async function selectTarget(page: Page, name: string | RegExp) {
  await page.getByTestId("agent-target").click();
  await page.getByRole("option", { name }).click();
}

function creationDialog(page: Page) {
  return page.locator('[data-slot="dialog-content"]').filter({ hasText: "创建行程" });
}

async function openTripsAndActivate(page: Page, name: string) {
  await page.getByRole("tab", { name: "Trips" }).click();
  const card = page.getByTestId("trip-card").filter({ hasText: name });
  await card.getByRole("button", { name: "激活" }).click();
  await expect(card).toContainText("激活中");
}

async function tripDetails(page: Page) {
  const response = await page.request.get("/api/trips");
  return (await response.json()) as { id: number; name: string; cityAdcode: string }[];
}

async function tripPlan(page: Page, id: number) {
  const response = await page.request.get(`/api/trips/${id}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    plan: { days: { stops: { poiId: string }[] }[]; unscheduled: { poiId: string }[] };
  };
}

function poiIds(plan: { days: { stops: { poiId: string }[] }[]; unscheduled: { poiId: string }[] }) {
  return [
    ...plan.days.flatMap((day) => day.stops.map((stop) => stop.poiId)),
    ...plan.unscheduled.map((stop) => stop.poiId),
  ];
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("agent entry is available on authenticated pages but not on the login page", async ({
  page,
}) => {
  await expect(page.getByTestId("agent-fab")).toBeVisible();
  await openAgent(page);
  await expect(page.getByText(/描述城市、日期、宠物/)).toBeVisible();
  await page.getByRole("button", { name: "关闭 Agent 面板" }).click();
  await expect(page.getByTestId("agent-panel")).toHaveCount(0);

  const anonymous = await page.context().browser()?.newContext();
  const anonymousPage = await anonymous!.newPage();
  await anonymousPage.goto("http://127.0.0.1:3100/login");
  await expect(anonymousPage.getByTestId("agent-fab")).toHaveCount(0);
  await anonymous!.close();
});

test("unauthenticated agent requests are rejected", async ({ request }) => {
  const response = await request.post("http://127.0.0.1:3100/agent", {
    data: { threadId: "t", runId: "r", messages: [] },
  });
  expect(response.status()).toBe(401);
});

test("creates a trip through the confirmation dialog and applies a reviewed plan", async ({
  page,
}) => {
  await openAgent(page);
  await sendAgentMessage(page, "帮我规划珠海两天的行程");

  const dialog = creationDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog).toHaveCount(0);

  const proposal = page.getByTestId("agent-proposal");
  await expect(proposal).toBeVisible({ timeout: 30_000 });

  const created = await tripDetails(page);
  expect(created).toHaveLength(1);
  const before = await tripPlan(page, created[0].id);
  expect(poiIds(before.plan)).toEqual([]);

  await proposal.getByRole("button", { name: "确认应用" }).click();
  await expect(proposal.getByText("方案已应用。")).toBeVisible({ timeout: 30_000 });

  const after = await tripPlan(page, created[0].id);
  expect(poiIds(after.plan).some((poiId) => poiId.startsWith("e2e-zhu-"))).toBe(true);
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBe(String(created[0].id));
});

test("confirms deactivation before creating a new trip while one is active", async ({
  page,
}) => {
  const pet = (await pets(page))[0];
  const existing = await createTripViaApi(page, {
    name: "已有珠海行程",
    cityAdcode: ZHUHAI,
    petId: pet.id,
    totalDays: 2,
  });
  await page.goto("/trips");
  await openTripsAndActivate(page, "已有珠海行程");

  await openAgent(page);
  await selectTarget(page, "新建行程");
  await sendAgentMessage(page, "再规划一个珠海两天的行程");

  const confirm = page.getByTestId("agent-deactivate-confirm");
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "确认并继续" }).click();

  const dialog = creationDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(page.getByTestId("agent-proposal")).toBeVisible({ timeout: 30_000 });

  const all = await tripDetails(page);
  expect(all).toHaveLength(2);
  const activeId = await page.evaluate(() =>
    window.localStorage.getItem("pawtrip.activeTripId"),
  );
  expect(activeId).not.toBe(String(existing.id));
});

test("modifies an inactive trip without activating it", async ({ page }) => {
  const pet = (await pets(page))[0];
  const trip = await createTripViaApi(page, {
    name: "未激活珠海行程",
    cityAdcode: ZHUHAI,
    petId: pet.id,
    totalDays: 2,
  });
  await page.goto("/trips");

  await openAgent(page);
  await selectTarget(page, "未激活珠海行程");
  await sendAgentMessage(page, "帮我调整这个行程");

  const proposal = page.getByTestId("agent-proposal");
  await expect(proposal).toBeVisible({ timeout: 30_000 });
  await proposal.getByRole("button", { name: "确认应用" }).click();
  await expect(proposal.getByText("方案已应用。")).toBeVisible({ timeout: 30_000 });

  const after = await tripPlan(page, trip.id);
  expect(poiIds(after.plan).some((poiId) => poiId.startsWith("e2e-zhu-"))).toBe(true);
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBeNull();
  await expect(page.getByTestId("trip-panel")).toHaveCount(0);
});

test("rejecting an unconfirmed plan leaves the trip unchanged", async ({ page }) => {
  const pet = (await pets(page))[0];
  const trip = await createTripViaApi(page, {
    name: "拒绝方案行程",
    cityAdcode: ZHUHAI,
    petId: pet.id,
    totalDays: 2,
  });
  await page.goto("/trips");

  await openAgent(page);
  await selectTarget(page, "拒绝方案行程");
  await sendAgentMessage(page, "帮我调整这个行程");

  const proposal = page.getByTestId("agent-proposal");
  await expect(proposal).toBeVisible({ timeout: 30_000 });
  const before = await tripPlan(page, trip.id);
  expect(poiIds(before.plan)).toEqual([]);

  await proposal.getByRole("button", { name: "拒绝" }).click();
  await expect(proposal.getByText("已拒绝该方案。")).toBeVisible();

  const after = await tripPlan(page, trip.id);
  expect(poiIds(after.plan)).toEqual([]);
});

test("explains when no pets exist", async ({ page }) => {
  const headers = await csrfHeaders(page);
  await page.request.post("/api/auth/logout", { headers });
  await signIn(page, "demo");
  await resetTrips(page);
  await page.goto("/");
  await openAgent(page);
  await sendAgentMessage(page, "帮我规划珠海行程");

  await expect(page.getByText(/请先在 Paws 页面添加宠物档案/)).toBeVisible({
    timeout: 30_000,
  });
  await expect(creationDialog(page)).toHaveCount(0);
});

test("warns when the Pawtrip location catalog is truncated", async ({ page }) => {
  const pet = (await pets(page))[0];
  await createTripViaApi(page, {
    name: "截断目录行程",
    cityAdcode: ZHUHAI,
    petId: pet.id,
    totalDays: 2,
  });
  await page.route("**/api/locations?*", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        page: pageNumber,
        pageSize: 100,
        totalElements: 2500,
        totalPages: 25,
        hasNext: true,
        hasPrevious: pageNumber > 1,
        items: [
          {
            poiId: "e2e-zhu-a",
            name: "情侣路",
            typeCode: "110000",
            typeGroup: "attraction",
            address: "珠海市香洲区",
            longitude: null,
            latitude: null,
            regionCode: "440402",
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
          },
        ],
      }),
    });
  });
  await page.goto("/trips");

  await openAgent(page);
  await selectTarget(page, "截断目录行程");
  await sendAgentMessage(page, "帮我调整这个行程");

  await expect(page.getByText(/匹配可能不完整/)).toBeVisible({ timeout: 30_000 });
  await page.unroute("**/api/locations?*");
});

test("explains when a requested location is not in Pawtrip", async ({ page }) => {
  const pet = (await pets(page))[0];
  await createTripViaApi(page, {
    name: "未命中地点行程",
    cityAdcode: ZHUHAI,
    petId: pet.id,
    totalDays: 2,
  });
  await page.goto("/trips");

  await openAgent(page);
  await selectTarget(page, "未命中地点行程");
  await sendAgentMessage(page, "帮我查找不存在的地点");

  await expect(page.getByText(/未找到匹配的 Pawtrip 已收录地点/)).toBeVisible({
    timeout: 30_000,
  });
});
