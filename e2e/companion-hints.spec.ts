import { expect, test, type Page } from "@playwright/test";
import { resetTrips, signIn } from "./trip-helpers";

const NAV_TABS = ["我的宠物", "城市浏览", "地点浏览", "交通规则", "我的行程"] as const;

async function waitBubbleText(page: Page, previous?: string) {
  const bubble = page.getByTestId("companion-bubble");
  const body = bubble.locator("p").last();
  await expect(bubble).toBeVisible({ timeout: 10_000 });
  if (previous !== undefined) {
    await expect(body).not.toHaveText(previous, { timeout: 10_000 });
  }
  const text = (await body.textContent())?.trim() ?? "";
  return { bubble, text };
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows one hint per page while navigating", async ({ page }) => {
  const texts = new Set<string>();
  let previous: string | undefined;

  for (const name of NAV_TABS) {
    await page.getByRole("tab", { name }).click();
    const { text } = await waitBubbleText(page, previous);
    texts.add(text);
    previous = text;
  }

  await page.getByRole("link", { name: "行程单" }).click();
  await expect(page).toHaveURL(/\/itinerary$/);
  const itinerary = await waitBubbleText(page, previous);
  texts.add(itinerary.text);

  await page.getByRole("tab", { name: "首页" }).click();
  await expect(page).toHaveURL(/\/$/);
  const home = await waitBubbleText(page, itinerary.text);
  texts.add(home.text);

  expect(texts.size).toBeGreaterThanOrEqual(5);
  for (const text of texts) {
    expect(text.length).toBeGreaterThan(0);
  }
  await expect(page.getByText(/· 伙伴提示$/)).toBeVisible();
});

test("dismisses the hint after five seconds", async ({ page }) => {
  await page.getByRole("tab", { name: "我的宠物" }).click();
  const { bubble } = await waitBubbleText(page);

  await page.waitForTimeout(3000);
  await expect(bubble).toBeVisible();

  await expect(bubble).toHaveCount(0, { timeout: 5000 });
});

test("opens the agent panel from the only entry", async ({ page }) => {
  await page.getByRole("tab", { name: "我的宠物" }).click();
  const { bubble } = await waitBubbleText(page);

  const fab = page.getByTestId("agent-fab");
  await expect(fab).toHaveCount(1);
  await expect(page.getByTestId("companion-avatar")).toHaveCount(0);

  const bubbleBox = await bubble.boundingBox();
  const fabBox = await fab.boundingBox();
  expect(bubbleBox).not.toBeNull();
  expect(fabBox).not.toBeNull();
  expect(bubbleBox!.y + bubbleBox!.height).toBeLessThanOrEqual(fabBox!.y + 1);

  await fab.click();
  await expect(page.getByTestId("agent-panel")).toBeVisible();
  await expect(bubble).toHaveCount(0);
  await page.getByRole("button", { name: "关闭 Agent 面板" }).click();
  await expect(page.getByTestId("agent-panel")).toHaveCount(0);
  await expect(fab).toBeVisible();
  await expect(bubble).toHaveCount(0);
});

test("suppresses the bubble on admin pages", async ({ page }) => {
  await signIn(page, "admin");
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await waitBubbleText(page);

  await page.getByRole("tab", { name: "地点管理" }).click();
  await expect(page).toHaveURL(/\/admin\/locations$/);
  await expect(page.getByTestId("companion-bubble")).toHaveCount(0);
  await expect(page.getByTestId("agent-fab")).toBeVisible();
});

test("does not restore the bubble after reload", async ({ page }) => {
  await page.getByRole("tab", { name: "我的宠物" }).click();
  await waitBubbleText(page);

  await page.reload();
  await page.waitForSelector("html[data-app-ready='true']");
  await expect(page.getByTestId("companion-bubble")).toHaveCount(0);
  await page.waitForTimeout(1000);
  await expect(page.getByTestId("companion-bubble")).toHaveCount(0);

  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page.getByTestId("companion-bubble")).toBeVisible({
    timeout: 10_000,
  });
});
