import { expect, test, type Page } from "@playwright/test";
import { csrfHeaders, signIn as signInWithApi } from "./trip-helpers";

const username = "admin";

async function signIn(page: Page, user = username) {
  await signInWithApi(page, user);
}

function policyUrl(adcode: string) {
  return `/destinations/${adcode}/policy`;
}

function dogInput(breedId: number) {
  return {
    name: "豆豆",
    petType: "DOG",
    weightKg: 10,
    shoulderHeightCm: 40,
    hasLeash: true,
    hasVaccinationProof: true,
    photo: null,
    dogBreedId: breedId,
  };
}

async function clearPets(page: Page) {
  const existing = await page.request.get("/api/pets");
  if (!existing.ok()) return;
  const headers = await csrfHeaders(page);
  for (const pet of (await existing.json()) as { id: number }[]) {
    const deleted = await page.request.delete(`/api/pets/${pet.id}`, {
      headers,
    });
    expect(deleted.ok()).toBeTruthy();
  }
}

async function resetPets(page: Page, breedId?: number | null) {
  await clearPets(page);

  if (breedId === undefined) {
    return;
  }
  const headers = await csrfHeaders(page);
  const created = await page.request.post("/api/pets", {
    headers,
    data:
      breedId === null
        ? {
            name: "咪咪",
            petType: "CAT",
            weightKg: 4,
            shoulderHeightCm: 25,
            hasLeash: false,
            hasVaccinationProof: false,
            photo: null,
            dogBreedId: null,
          }
        : dogInput(breedId),
  });
  expect(created.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// admin 的「无宠物档案」是其他用例的前置条件，本文件创建的宠物必须清理
test.afterEach(async ({ page }) => {
  await clearPets(page);
});

test("warns when the pet breed is on the banned list", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/禁养犬种提醒/)).toBeVisible();
  await expect(page.getByText(/豆豆/).first()).toBeVisible();
  await expect(page.getByText(/比特犬属于当地禁养犬种/)).toBeVisible();
  await expect(page.getByText(/禁养犬种名单/)).toBeVisible();
});

test("renders only a few banned breed examples", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText("禁养犬种名单（严格管理区）")).toBeVisible();
  await expect(page.getByText(/等 8 种/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "可携带犬种" }),
  ).toBeVisible();
  await expect(page.getByText("柯基犬").first()).toBeVisible();
  await expect(page.getByText(/等 7 种/)).toBeVisible();
  await expect(page.getByText("比特斗牛梗犬")).toHaveCount(0);
  await expect(page.getByText("日本土佐")).toHaveCount(0);
  await expect(page.getByText("斯塔福梗犬")).toHaveCount(0);
});

test("does not judge when the breed is neither banned nor allowed", async ({
  page,
}) => {
  await resetPets(page, 12);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText("豆豆 · 无法判定")).toBeVisible();
  await expect(page.getByText(/禁养犬种名单/)).toBeVisible();
  await expect(page.getByText(/以当地政府最新文件为准/)).toBeVisible();
});

test("confirms when the pet breed is on the allowed list", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText("豆豆 · 友好")).toBeVisible();
  await expect(page.getByText(/柯基犬/).first()).toBeVisible();
});

test("does not judge when no pet profile is available", async ({ page }) => {
  await resetPets(page);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/尚未填写宠物档案/)).toBeVisible();
});

test("does not judge a pet without a dog breed", async ({ page }) => {
  await resetPets(page, null);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText("咪咪 · 无法判定")).toBeVisible();
});

test("shows an empty state for a city without policy", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("440300"));

  await expect(page.getByText("暂无当地政策数据")).toBeVisible();
});

test("shows an error for an unknown city", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("999999"));

  await expect(page.getByText(/City was not found/)).toBeVisible();
});

test("shows source, update month and area scope", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/更新于 2025-07/)).toBeVisible();
  await expect(page.getByText(/适用范围：严格管理区/)).toBeVisible();
  await expect(page.getByText(/公开发布的通告/)).toBeVisible();
  await expect(page.getByText(/以当地政府最新文件为准/)).toBeVisible();
});

test("city policy page remains reachable by direct URL", async ({ page }) => {
  await page.goto("/cities");
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await expect(
    page.getByRole("link", { name: /查看.*的城市政策/ }),
  ).toHaveCount(0);

  await page.goto(policyUrl("440400"));
  await expect(page.getByText("珠海市养宠政策")).toBeVisible();
});

test("opens the city policy from the city browsing sidebar", async ({ page }) => {
  await page.goto("/cities");
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await expect(page.getByText("共 1 个候选")).toBeVisible();

  await page
    .getByTestId("city-card")
    .getByText("珠海市", { exact: true })
    .click();
  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await panel.getByRole("link", { name: "查看完整政策与来源" }).click();

  await expect(page).toHaveURL(/\/destinations\/440400\/policy$/);
  await expect(page.getByText("珠海市养宠政策")).toBeVisible();
});

test("does not render a destination list or filter", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));
  await expect(page.getByText("珠海市养宠政策")).toBeVisible();

  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
});

test("does not render a pet profile form", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));
  await expect(page.getByText("珠海市养宠政策")).toBeVisible();

  await expect(page.getByRole("button", { name: /保存档案/ })).toHaveCount(0);
});

test("does not expose the admin policy endpoint", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const page = await context.newPage();

  try {
    await signIn(page, "admin");
    const response = await page.request.get("/api/admin/pet-policies");

    expect(response.status()).toBe(404);
  } finally {
    await context.close();
  }
});

test("does not render a booking entry", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));
  await expect(page.getByText("珠海市养宠政策")).toBeVisible();

  await expect(page.getByRole("link", { name: /订票|预订/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /订票|预订/ })).toHaveCount(0);
});

async function editZhuhaiAllowedBreeds(page: Page, breedName: string, checked: boolean) {
  await page.goto("/admin/cities");
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await page.getByRole("button", { name: "编辑 珠海市" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "搜索犬种" }).fill(breedName);
  const checkbox = dialog.getByRole("checkbox", { name: breedName });
  await expect(checkbox).toBeVisible();
  if ((await checkbox.isChecked()) !== checked) {
    await checkbox.click();
  }
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByText("城市政策已更新。")).toBeVisible();
}

async function removeZhuhaiAllowedBreed(breedId: number | undefined) {
  const dbPath = process.env.PAWTRIP_E2E_DB_PATH;
  if (!dbPath || breedId === undefined) return;
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA busy_timeout = 10000");
    db.prepare(
      "DELETE FROM city_allowed_dog_breed WHERE adcode = ? AND dog_breed_id = ?",
    ).run("440400", breedId);
  } finally {
    db.close();
  }
}

test("admin configures allowed breeds and the policy page reflects it", async ({
  page,
}) => {
  const breeds = (await (
    await page.request.get("/api/dog-breeds")
  ).json()) as { id: number; name: string }[];
  const samoyed = breeds.find((breed) => breed.name === "萨摩耶犬");
  if (!samoyed) throw new Error("Dog breed fixture missing: 萨摩耶犬");

  try {
    await editZhuhaiAllowedBreeds(page, samoyed.name, true);

    await resetPets(page, samoyed.id);
    await page.goto(policyUrl("440400"));
    await expect(page.getByText("珠海市养宠政策")).toBeVisible();
    await expect(page.getByText("豆豆 · 友好")).toBeVisible();
    await expect(page.getByText(/萨摩耶犬/).first()).toBeVisible();

    await editZhuhaiAllowedBreeds(page, samoyed.name, false);

    await page.goto(policyUrl("440400"));
    await expect(page.getByText("珠海市养宠政策")).toBeVisible();
    await expect(page.getByText("豆豆 · 无法判定")).toBeVisible();
  } finally {
    await removeZhuhaiAllowedBreed(samoyed.id);
  }
});
