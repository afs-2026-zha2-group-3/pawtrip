import { expect, test } from "@playwright/test";

const username = "demo";
const password = "pawtrip-demo";

async function openLogin(page: import("@playwright/test").Page) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
}

async function signIn(page: import("@playwright/test").Page) {
  await openLogin(page);
  const usernameInput = page.getByLabel("Username");
  await usernameInput.fill(username);
  await expect(usernameInput).toHaveValue(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("redirects a guest away from the protected home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Hello World")).toHaveCount(0);
});

test("shows a generic error for invalid credentials", async ({ page }) => {
  await openLogin(page);
  const usernameInput = page.getByLabel("Username");
  await usernameInput.fill(username);
  await expect(usernameInput).toHaveValue(username);
  await page.getByLabel("Password").fill("invalid-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Invalid username or password.",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("keeps the session after a successful sign-in and page refresh", async ({
  page,
}) => {
  await signIn(page);

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Hello World")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Hello World")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("requires sign-in again after logging out", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Hello World")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Hello World")).toHaveCount(0);
});
