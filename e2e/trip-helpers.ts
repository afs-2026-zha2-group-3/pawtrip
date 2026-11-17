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
  await expect(page.getByText(/共 \d+ 个候选/)).toBeVisible();
}

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function openTripDialog(page: Page, cityName: string) {
  await cityCard(page, cityName).getByRole("button", { name: "选定" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(cityName).first()).toBeVisible();
  return dialog;
}

export async function pickCalendarDate(page: Page, iso: string) {
  const calendar = page
    .getByRole("dialog")
    .locator('[data-slot="calendar-range"]');
  const targetMonth = iso.slice(0, 7);
  for (let step = 0; step < 36; step++) {
    const visibleMonth = await calendar.getAttribute("data-month");
    if (visibleMonth === targetMonth) break;
    const label = visibleMonth && visibleMonth < targetMonth ? "下个月" : "上个月";
    await calendar.getByRole("button", { name: label }).click();
  }
  await expect(calendar).toHaveAttribute("data-month", targetMonth);
  await calendar.locator(`[data-date="${iso}"]`).click();
}

export async function setTripDates(page: Page, days: number): Promise<string> {
  const startDate = isoDate(1);
  await pickCalendarDate(page, startDate);
  await pickCalendarDate(page, isoDate(days));
  return startDate;
}

export async function activeTripDetail(page: Page) {
  const tripId = await page.evaluate(() =>
    window.localStorage.getItem("pawtrip.activeTripId"),
  );
  const response = await page.request.get(`/api/trips/${tripId}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    startDate: string | null;
    totalDays: number;
  };
}

export async function confirmTripDialog(page: Page) {
  const created = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/trips" &&
      response.request().method() === "POST",
  );
  await page.getByRole("dialog").getByRole("button", { name: "确定" }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/attractions$/);
}

export async function chooseTripPet(page: Page, petName: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "选择携带宠物" }).click();
  await page.getByRole("option", { name: petName }).click();
}

export async function createTrip(
  page: Page,
  { city, days, pet }: { city: string; days: number; pet?: string },
) {
  await openCities(page);
  await openTripDialog(page, city);
  await setTripDates(page, days);
  if (pet) {
    await chooseTripPet(page, pet);
  }
  await confirmTripDialog(page);
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
  input: {
    name: string;
    cityAdcode: string;
    petId: number;
    totalDays: number;
    startDate?: string | null;
  },
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

export async function withTripPanelNotBlocking(page: Page, action: () => Promise<void>) {
  await page.getByTestId("trip-panel").evaluate((panel) => {
    (panel as HTMLElement).style.pointerEvents = "none";
  });
  try {
    await action();
  } finally {
    await page.getByTestId("trip-panel").evaluate((panel) => {
      (panel as HTMLElement).style.pointerEvents = "";
    });
  }
}
