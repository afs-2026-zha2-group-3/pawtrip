import { expect, type Page } from "@playwright/test";

export const PASSWORD = "123456";

export async function signIn(page: Page, username = "petowner") {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  const usernameInput = page.getByLabel("Username");
  const passwordInput = page.getByLabel("Password");
  await expect(async () => {
    await usernameInput.fill(username);
    await passwordInput.fill(PASSWORD);
    await expect(usernameInput).toHaveValue(username, { timeout: 300 });
    await expect(passwordInput).toHaveValue(PASSWORD, { timeout: 300 });
  }).toPass({ timeout: 5000 });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("tab", { name: "城市浏览" })).toBeVisible();
}

export async function csrfHeaders(page: Page): Promise<Record<string, string>> {
  const token = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  )?.value;
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
