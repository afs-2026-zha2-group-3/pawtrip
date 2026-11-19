import { expect, test } from "@playwright/test";

const username = "demo";
const password = "123456";

async function openLogin(page: import("@playwright/test").Page) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
}

async function signIn(page: import("@playwright/test").Page) {
  await openLogin(page);
  const usernameInput = page.getByLabel("用户名");
  await usernameInput.fill(username);
  await expect(usernameInput).toHaveValue(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
}

test("keeps the session after a successful sign-in and page refresh", async ({
  page,
}) => {
  await signIn(page);

  await expect(page).toHaveURL("/");

  await page.reload();

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("requires sign-in again after logging out", async ({ page }) => {
  await signIn(page);

  await page.getByRole("button", { name: "Log out" }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
