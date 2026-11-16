import { expect, test, type Page } from "@playwright/test";

const username = "admin";
const password = "123456";

async function signIn(page: Page, user = username) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
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

async function csrfHeaders(page: Page) {
  let token = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  )?.value;
  if (!token) {
    await page.request.get("/api/auth/me");
    token = (await page.context().cookies()).find(
      (cookie) => cookie.name === "XSRF-TOKEN",
    )?.value;
  }
  return token ? { "X-XSRF-TOKEN": token } : {};
}

async function resetPets(page: Page, breedId?: number | null) {
  const existing = await page.request.get("/api/pets");
  expect(existing.ok()).toBeTruthy();
  const headers = await csrfHeaders(page);
  for (const pet of (await existing.json()) as { id: number }[]) {
    const deleted = await page.request.delete(`/api/pets/${pet.id}`, {
      headers,
    });
    expect(deleted.ok()).toBeTruthy();
  }

  if (breedId === undefined) {
    return;
  }
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

test("warns when the pet breed is on the banned list", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/禁养犬种提醒/)).toBeVisible();
  await expect(page.getByText(/豆豆/).first()).toBeVisible();
  await expect(page.getByText(/比特犬/).first()).toBeVisible();
  await expect(page.getByText(/不支持您带这只宠物来旅游/)).toBeVisible();
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
  await expect(page.getByText("暂未收录可携带犬种")).toBeVisible();
  await expect(page.getByText("比特斗牛梗犬")).toHaveCount(0);
  await expect(page.getByText("日本土佐")).toHaveCount(0);
  await expect(page.getByText("斯塔福梗犬")).toHaveCount(0);
});

test("does not judge when the breed is not in the allowed list", async ({ page }) => {
  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));

  await expect(
    page.getByRole("heading", { name: "暂时无法判断" }),
  ).toBeVisible();
  await expect(page.getByText(/禁养犬种名单/)).toBeVisible();
  await expect(page.getByText(/以当地政府最新文件为准/)).toBeVisible();
});

test("does not judge when no pet profile is available", async ({ page }) => {
  await resetPets(page);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/尚未填写宠物档案/)).toBeVisible();
});

test("does not judge a pet without a dog breed", async ({ page }) => {
  await resetPets(page, null);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/暂无犬种信息/)).toBeVisible();
  await expect(page.getByText(/暂时无法判断/)).toBeVisible();
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

test("opens the city policy from city browsing", async ({ page }) => {
  await page.goto("/cities");
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");

  const policyLink = page.getByRole("link", {
    name: "查看珠海市的城市政策",
  });
  await expect(policyLink).toBeVisible();
  await policyLink.click();

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

test("admin configures allowed breeds and the policy page reflects it", async ({
  page,
}) => {
  await page.goto("/admin/cities");
  await page.getByLabel("城市").selectOption({ label: "珠海市" });

  const allowed = page.getByRole("checkbox", { name: "柯基犬" });
  await expect(allowed).toBeVisible();
  if (!(await allowed.isChecked())) {
    await allowed.click();
  }
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("已保存")).toBeVisible();

  await resetPets(page, 10);
  await page.goto(policyUrl("440400"));
  await expect(page.getByText(/未命中禁养名单/)).toBeVisible();
  await expect(page.getByText(/可携带犬种名单中/)).toBeVisible();
});
