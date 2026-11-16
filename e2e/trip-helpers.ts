import { expect, test, type Page } from "@playwright/test";

export const PASSWORD = "123456";

export function workerUsername() {
  // parallelIndex 是并发槽位（0..workers-1）；workerIndex 是进程全局编号，可能超过 worker 数。
  return `petowner-w${test.info().parallelIndex}`;
}

export async function signIn(page: Page, username = workerUsername()) {
  await page.request.get("/api/auth/me");
  const headers = await csrfHeaders(page);
  const response = await page.request.post("/api/auth/login", {
    headers,
    form: { username, password: PASSWORD },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/");
  // SSR 已输出导航标签，需等客户端脚本完成注水，后续点击才会触发路由。
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("tab", { name: "城市浏览" })).toBeVisible();
}

export async function csrfHeaders(page: Page): Promise<Record<string, string>> {
  const readToken = async () =>
    (await page.context().cookies()).find(
      (cookie) => cookie.name === "XSRF-TOKEN",
    )?.value;
  let token = await readToken();
  if (!token) {
    await page.request.get("/api/auth/me");
    token = await readToken();
  }
  return token ? { "X-XSRF-TOKEN": token } : {};
}

export async function resetTrips(page: Page) {
  const headers = await csrfHeaders(page);
  const response = await page.request.get("/api/trips");
  const trips = (await response.json()) as { id: number }[];
  for (const trip of trips) {
    await page.request.delete(`/api/trips/${trip.id}`, { headers });
  }
}

export function cityCard(page: Page, cityName: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: cityName });
}

export async function openCities(page: Page) {
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(
    page.getByText(/共 \d+ 个候选|草稿未确认|行程已激活/).first(),
  ).toBeVisible();
}

export async function selectCity(page: Page, cityName: string) {
  await cityCard(page, cityName).getByRole("button", { name: "选定" }).click();
  await expect(page.getByRole("heading", { name: cityName, level: 1 })).toBeVisible();
  await expect(page.getByTestId("trip-panel")).toContainText("未确认草稿");
}

export async function setDraftDays(page: Page, days: number) {
  const panel = page.getByTestId("trip-panel");
  const input = panel.getByRole("textbox", { name: "行程天数" });
  await input.fill(String(days));
  await expect(input).toHaveValue(String(days));
}

export async function chooseDraftPet(page: Page, petName: string) {
  const panel = page.getByTestId("trip-panel");
  await panel.getByRole("combobox", { name: "选择携带宠物" }).click();
  await page.getByRole("option", { name: petName }).click();
}

export async function confirmDraft(page: Page) {
  const created = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/trips" &&
      response.request().method() === "POST",
  );
  await page.getByTestId("trip-panel-confirm").click();
  const response = await created;
  expect(response.status()).toBe(201);
  await expect(page.getByTestId("trip-panel")).not.toContainText("未确认草稿");
  await expect(page.getByTestId("save-status")).toContainText("已保存");
}

export async function createTrip(
  page: Page,
  { city, days, pet }: { city: string; days: number; pet: string },
) {
  await openCities(page);
  await selectCity(page, city);
  await setDraftDays(page, days);
  await chooseDraftPet(page, pet);
  await confirmDraft(page);
}

export async function openTrips(page: Page) {
  const list = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/trips" &&
      response.request().method() === "GET",
  );
  await page.getByRole("tab", { name: "Trips" }).click();
  await expect(page).toHaveURL(/\/trips$/);
  await list;
}

export function tripCard(page: Page, name: string) {
  return page.getByTestId("trip-card").filter({ hasText: name });
}

export async function createTripViaApi(
  page: Page,
  input: { name: string; cityAdcode: string; petId: number; totalDays: number },
) {
  const headers = await csrfHeaders(page);
  const response = await page.request.post("/api/trips", {
    headers,
    data: {
      ...input,
      plan: { version: 1, days: [], unscheduled: [] },
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: number };
}

export async function pets(page: Page) {
  return (await (await page.request.get("/api/pets")).json()) as {
    id: number;
    name: string;
  }[];
}
