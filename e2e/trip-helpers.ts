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

  // SSR 已渲染 header，可见性不能代表可交互；等待客户端注水标记。
  await page.goto("/");
  await page.waitForSelector("html[data-app-ready='true']", {
    timeout: 15_000,
  });
  await expect(page.getByRole("tab", { name: "城市浏览" }).first()).toBeVisible({
    timeout: 15_000,
  });
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
  await page.evaluate(() =>
    window.localStorage.removeItem("pawtrip.activeTripId"),
  );
}

export function cityCard(page: Page, cityName: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: cityName });
}

export async function openCities(page: Page) {
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.getByText(/共 \d+ 个候选/)).toBeVisible({ timeout: 15_000 });
}

export async function searchCity(page: Page, keyword: string) {
  const search = page.getByRole("textbox", { name: "搜索城市" });
  await search.fill(keyword);
  await expect(page.getByText("共 1 个候选")).toBeVisible();
}

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function openTripDialog(page: Page, cityName: string) {
  await searchCity(page, cityName);
  await cityCard(page, cityName).getByRole("button", { name: "Pick" }).click();
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
  await expect(page).toHaveURL(/\/transport-rules$/);
  await page.getByRole("radio", { name: "选择自驾" }).check();
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-status",
    "saved",
  );
  await page.getByRole("button", { name: "确认大交通并选择地点" }).click();
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
  await page.getByRole("tab", { name: "我的行程" }).click();
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
    transportMode?: string | null;
    plan?: { version: 1; days: unknown[]; unscheduled: unknown[] };
  },
) {
  const headers = await csrfHeaders(page);
  const response = await page.request.post("/api/trips", {
    headers,
    data: {
      ...input,
      transportMode: input.transportMode ?? null,
      plan: input.plan ?? { version: 1, days: [], unscheduled: [] },
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: number };
}

export async function createActiveTripViaApi(
  page: Page,
  input: {
    cityAdcode: string;
    petName?: string;
    name?: string;
    totalDays?: number;
    startDate?: string | null;
    transportMode?: string | null;
    plan?: { version: 1; days: unknown[]; unscheduled: unknown[] };
  },
) {
  const allPets = await pets(page);
  const pet = input.petName
    ? allPets.find((candidate) => candidate.name === input.petName)
    : allPets[0];
  if (!pet) {
    throw new Error(`Seed pet ${input.petName ?? "(first)"} not found`);
  }
  const trip = await createTripViaApi(page, {
    name: input.name ?? `e2e-${input.cityAdcode}`,
    cityAdcode: input.cityAdcode,
    petId: pet.id,
    totalDays: input.totalDays ?? 1,
    startDate: input.startDate ?? null,
    transportMode: input.transportMode ?? null,
    plan: input.plan,
  });
  await page.evaluate(
    (tripId) =>
      window.localStorage.setItem("pawtrip.activeTripId", String(tripId)),
    trip.id,
  );
  return trip;
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
