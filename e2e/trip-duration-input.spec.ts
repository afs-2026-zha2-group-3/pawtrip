import { expect, test, type Page } from "@playwright/test";

const username = "demo";
const password = "123456";
const SELECTED_KEY = "pawtrip.selectedDestination";
const DURATION_KEY = "pawtrip.tripDuration";

async function signIn(page: Page) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

async function openCities(page: Page) {
  const candidatesResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/destinations",
  );
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await candidatesResponse;
}

async function selectCityAndReturnToCities(page: Page) {
  const attractionsResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/locations/attractions",
  );
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: "杭州市" })
    .getByRole("button", { name: "选定" })
    .click();
  await expect(page).toHaveURL(/\/attractions$/);
  await attractionsResponse;
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await page.evaluate(([selectedKey, durationKey]) => {
    sessionStorage.removeItem(selectedKey);
    sessionStorage.removeItem(durationKey);
  }, [SELECTED_KEY, DURATION_KEY]);
  await openCities(page);
});

test("shows a default one-day input before selecting a destination", async ({ page }) => {
  const duration = page.getByRole("spinbutton", { name: "旅游总天数" });
  const selectButton = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "杭州市" })
    .getByRole("button", { name: "选定" });

  await expect(duration).toHaveValue("1");
  await expect(selectButton).toBeEnabled();

  await duration.fill("");
  await expect(selectButton).toBeDisabled();
  await duration.fill("3");
  await duration.press("Tab");
  await expect(duration).toHaveValue("3");
  await expect(selectButton).toBeEnabled();

  const attractionsResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/locations/attractions",
  );
  await selectButton.click();
  await expect(page).toHaveURL(/\/attractions$/);
  await attractionsResponse;
  await expect(page.getByRole("tab", { name: "第1天" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "第2天" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "第3天" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /第[4-7]天/ })).toHaveCount(0);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), DURATION_KEY)).toBe("3");
});

test("shows the saved duration after returning to the selected destination", async ({ page }) => {
  await selectCityAndReturnToCities(page);
  const duration = page.getByRole("spinbutton", { name: "旅游总天数" });

  await expect(page.getByRole("alert")).toContainText("目的地已选定：杭州市");
  await expect(duration).toHaveValue("1");

  await duration.fill("5");
  await duration.press("Tab");
  expect(await page.evaluate((key) => sessionStorage.getItem(key), DURATION_KEY)).toBe("5");
});

test("keeps the stepper at 1 and 7 and prompts at both bounds", async ({ page }) => {
  await selectCityAndReturnToCities(page);
  const duration = page.getByRole("spinbutton", { name: "旅游总天数" });

  await duration.fill("1");
  await page.getByRole("button", { name: "减少旅游总天数" }).click();
  await expect(duration).toHaveValue("1");
  await expect(page.getByText("旅游总天数不能少于 1 天。")).toBeVisible();

  await duration.fill("7");
  await page.getByRole("button", { name: "增加旅游总天数" }).click();
  await expect(duration).toHaveValue("7");
  await expect(page.getByText("旅游总天数不能超过 7 天。")).toBeVisible();
});

test("does not overwrite a legal session value with an invalid input", async ({ page }) => {
  await selectCityAndReturnToCities(page);
  const duration = page.getByRole("spinbutton", { name: "旅游总天数" });

  await duration.fill("3");
  await duration.press("Tab");
  for (const invalid of ["0", "8", "1.5", "abc", ""]) {
    await duration.fill(invalid);
    await duration.press("Tab");
    await expect(page.getByText(/请输入 1–7 之间的整数|旅游总天数不能/)).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), DURATION_KEY)).toBe("3");
  }
});

test("restores the saved duration after refreshing the same tab", async ({ page }) => {
  await selectCityAndReturnToCities(page);
  const duration = page.getByRole("spinbutton", { name: "旅游总天数" });

  await duration.fill("5");
  await duration.press("Tab");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("目的地已选定：杭州市");
  await expect(page.getByRole("spinbutton", { name: "旅游总天数" })).toHaveValue("5");
});
