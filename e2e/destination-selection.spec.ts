import { expect, test, type Page } from "@playwright/test";

const username = "demo";
const password = "123456";
const SELECTED_KEY = "pawtrip.selectedDestination";

async function signIn(page: Page, as: "user" | "admin" = "user") {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  const usernameInput = page.getByLabel("Username");
  const passwordInput = page.getByLabel("Password");
  const name = as === "admin" ? "admin" : username;
  // 登出后二次登录：waitForResponse 可能命中旧文档在途的 /api/auth/me，
  // 新文档水合完成前的 fill 会被受控输入重置；重填直至值稳定
  await expect(async () => {
    await usernameInput.fill(name);
    await passwordInput.fill(password);
    await expect(usernameInput).toHaveValue(name, { timeout: 300 });
    await expect(passwordInput).toHaveValue(password, { timeout: 300 });
  }).toPass({ timeout: 5000 });
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

function cityCard(page: Page, cityName: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: cityName });
}

async function candidateCount(page: Page): Promise<number> {
  const text = await page.getByText(/共 \d+ 个候选/).textContent();
  return Number(text?.match(/共 (\d+) 个候选/)?.[1] ?? NaN);
}

// E1 — 候选列表：城市级行政区卡片（政策收录判断 TODO，暂不展示 Badge）
test("E1 shows all city-level candidates", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
  expect(await candidateCount(page)).toBeGreaterThan(2);
});

// E2 — 城市搜索：关键词过滤 + 计数 + 空态
test("E2 searches by city or province keyword and shows empty state", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  const search = page.getByRole("textbox", { name: "搜索城市" });
  await search.fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toHaveCount(0);

  await search.fill("广东");
  await expect(cityCard(page, "珠海市")).toBeVisible();
  expect(await candidateCount(page)).toBeGreaterThan(1);
  await expect(cityCard(page, "杭州市")).toHaveCount(0);

  await search.fill("不存在的城市");
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

// E3 — 宠物友好筛选：默认城市均未设每人限养数（null）→ 全部友好保留
test("E3 pet-friendly filter keeps all cities without per-person limit", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  const total = await candidateCount(page);
  await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
  await expect(page.getByRole("checkbox", { name: "宠物友好筛选" })).toBeChecked();
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
});

// E5 — 关闭筛选恢复全部候选
test("E5 turning the filter off restores all candidates", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  const total = await candidateCount(page);
  const filter = page.getByRole("checkbox", { name: "宠物友好筛选" });
  await filter.click();
  await page.getByRole("textbox", { name: "搜索城市" }).fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();

  await filter.click();
  await expect(filter).not.toBeChecked();
  await page.getByRole("textbox", { name: "搜索城市" }).fill("");
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
});

// E7 — 选定目的地：确认提示承载规划上下文
test("E7 selecting a city confirms and shows planning context", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();

  const confirmation = page.getByRole("alert").filter({ hasText: "目的地已选定" });
  await expect(confirmation).toContainText("杭州市");
  await expect(confirmation).toContainText("行程规划将使用杭州市");
});

// E8 — 刷新/重进保留选定
test("E8 keeps the selection across reload and re-entry", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toBeVisible();

  await page.reload();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("杭州市");

  await page.getByRole("tab", { name: "Home" }).click();
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("杭州市");
});

// E9 — 重选覆盖 + 跨页面 chip 同步
test("E9 reselecting overwrites the destination and syncs the header chip", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();

  await cityCard(page, "珠海市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("珠海市")).toBeVisible();
  await expect(page.locator("header").getByText("杭州市")).toHaveCount(0);

  await page.getByRole("tab", { name: "Home" }).click();
  await expect(page.locator("header").getByText("珠海市")).toBeVisible();
});

// E12 — 顶栏 chip：未选/已选
test("E12 header chip shows unset and selected destination", async ({ page }) => {
  await signIn(page);
  await expect(page.locator("header").getByText("目的地未选")).toBeVisible();

  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  await expect(page.locator("header").getByText("目的地未选")).toHaveCount(0);
});

// E13 — 确认登出清除已选目的地与缓存
test("E13 confirmed logout clears the persisted destination", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), SELECTED_KEY),
  ).not.toBeNull();

  await page.getByRole("button", { name: "Log out" }).click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), SELECTED_KEY),
  ).toBeNull();

  await signIn(page);
  await expect(page.locator("header").getByText("目的地未选")).toBeVisible();
});

// E14 — 导航三 Tab 与 /cities 同步；管理 Tab 守卫（回归）
test("E14 keeps tab navigation, city route sync and admin guard", async ({ page }) => {
  await signIn(page);
  for (const tab of ["Home", "Paws", "城市浏览"]) {
    await expect(page.getByRole("tab", { name: tab })).toBeVisible();
  }
  await expect(page.getByRole("tab", { name: "地点管理" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "城市管理" })).toHaveCount(0);

  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute("aria-selected", "true");

  // USER 直接访问管理路由 → 返回普通受保护页面
  await page.goto("/admin/cities");
  await expect(page).toHaveURL("/");

  // 未登录访问 /cities → /login
  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/cities");
  await expect(page).toHaveURL(/\/login$/);
});

test("E14 admin sees management tabs synced with admin routes", async ({ page }) => {
  await signIn(page, "admin");
  await expect(page.getByRole("tab", { name: "地点管理" })).toBeVisible();
  await page.getByRole("tab", { name: "城市管理" }).click();
  await expect(page).toHaveURL(/\/admin\/cities$/);
  await expect(page.getByRole("tab", { name: "城市管理" })).toHaveAttribute("aria-selected", "true");
});

// E15 — 反向：/cities 不展示政策条文详情（Non-goal #14）
test("E15 does not expose policy detail content or entry on /cities", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(page.getByRole("button", { name: "查看政策" })).toHaveCount(0);
  await expect(page.getByText("政策条文")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /养犬政策/ })).toHaveCount(0);
});

// E16 — 反向：筛选仅政策维度，无设施/评价参与（Non-goal Release 2）
test("E16 filter offers only the pet-friendly dimension without facility or rating", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByText("设施", { exact: true })).toHaveCount(0);
  await expect(page.getByText("评价", { exact: true })).toHaveCount(0);
});

// E17 — 匹配标签 + 叠加筛选（admin 账号建档案，避免与 demo 的 paws 用例并行干扰）
test("E17 match badges and stacked filter follow the pet profile", async ({ page }) => {
  const dbPath = process.env.PAWTRIP_E2E_DB_PATH;
  expect(dbPath).toBeTruthy();
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath!);
  let breedId = -1;
  try {
    await signIn(page, "admin");
    const breeds = (await (await page.request.get("/api/dog-breeds")).json()) as { id: number }[];
    const breed = breeds[0];
    breedId = breed.id;
    const xsrf = (await page.context().cookies()).find((cookie) => cookie.name === "XSRF-TOKEN")?.value ?? "";
    const created = await page.request.post("/api/pets", {
      headers: { "X-XSRF-TOKEN": xsrf },
      data: {
        name: "E17匹配犬",
        petType: "DOG",
        weightKg: 10,
        shoulderHeightCm: 40,
        hasLeash: true,
        hasVaccinationProof: true,
        photo: null,
        dogBreedId: breed.id,
      },
    });
    expect(created.ok()).toBeTruthy();
    const pet = (await created.json()) as { id: number };

    // 杭州=仅 CAT（不匹配）；珠海=CAT,DOG 且允许该品种（匹配，V16 种子+本用例追加）；
    // 石家庄=种子类型允许但档案品种（中华田园犬）不在种子允许列表（不匹配）
    db.exec("UPDATE administrative_region SET allowed_pet_types = 'CAT' WHERE adcode = '330100'");
    db.exec("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' WHERE adcode = '440400'");
    db.exec(`INSERT OR IGNORE INTO city_allowed_dog_breed (adcode, dog_breed_id) VALUES ('440400', ${breed.id})`);

    await openCities(page);
    await expect(cityCard(page, "杭州市").getByText("不匹配", { exact: true })).toBeVisible();
    await expect(cityCard(page, "珠海市").getByText("匹配", { exact: true })).toBeVisible();
    await expect(cityCard(page, "石家庄市").getByText("不匹配", { exact: true })).toBeVisible();

    // 叠加筛选：档案品种不在其他城市种子允许列表，仅珠海（类型+品种+肩高均允许）保留
    await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
    await expect(cityCard(page, "杭州市")).toHaveCount(0);
    await expect(cityCard(page, "石家庄市")).toHaveCount(0);
    await expect(cityCard(page, "珠海市")).toBeVisible();
    await expect(page.getByText("共 1 个候选")).toBeVisible();

    // 肩高维度：珠海上限 35 < 档案肩高 40 → 不匹配且被筛选排除；null=不限制
    db.exec("UPDATE administrative_region SET max_single_pet_shoulder_height_cm = 35 WHERE adcode = '440400'");
    await page.reload();
    await expect(cityCard(page, "珠海市").getByText("不匹配", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
    await expect(page.getByText("共 0 个候选")).toBeVisible();
    db.exec("UPDATE administrative_region SET max_single_pet_shoulder_height_cm = NULL WHERE adcode = '440400'");
    await page.reload();
    await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
    await expect(cityCard(page, "珠海市").getByText("匹配", { exact: true })).toBeVisible();
    await expect(page.getByText("共 1 个候选")).toBeVisible();

    const deleted = await page.request.delete(`/api/pets/${pet.id}`, {
      headers: { "X-XSRF-TOKEN": xsrf },
    });
    expect(deleted.ok()).toBeTruthy();
  } finally {
    // 恢复 V16 全城市种子口径，仅移除本用例追加的品种行与肩高/类型改动
    db.exec("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' WHERE adcode = '330100'");
    db.exec("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG', "
      + "max_single_pet_shoulder_height_cm = NULL WHERE adcode = '440400'");
    db.exec(`DELETE FROM city_allowed_dog_breed WHERE adcode = '440400' AND dog_breed_id = ${breedId}`);
    db.close();
  }
});

// E18 — 取消选定：已选定按钮再点一次清除
test("E18 clicking the selected card again clears the selection", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await cityCard(page, "杭州市").getByRole("button", { name: "选定", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("杭州市");

  await cityCard(page, "杭州市").getByRole("button", { name: "已选定" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toHaveCount(0);
  await expect(page.locator("header").getByText("目的地未选")).toBeVisible();
  const stored = await page.evaluate((key) => window.sessionStorage.getItem(key), SELECTED_KEY);
  expect(stored).toBeNull();

  await cityCard(page, "珠海市").getByRole("button", { name: "选定", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("珠海市");
});

// ---- 门控用例（@profile-dependency）----
// 政策收录/禁养数据源未定（判断点 TODO）；档案 breed 已随 PR #41 交付，门控仅剩政策数据源；
// 数据源落地后恢复 E4/E6/E10/E11。

test.fixme("E4 @profile-dependency filter excludes cities banning the profile breed", async ({ page }) => {
  // 前置：档案品种=比特犬（两城均禁养）
  await signIn(page);
  await openCities(page);
  await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

test.fixme("E6 @profile-dependency banned-breed badge shows only on hitting covered cities", async ({ page }) => {
  // 前置：档案品种=比特犬
  await signIn(page);
  await openCities(page);
  await expect(cityCard(page, "杭州市").getByText("档案品种禁养")).toBeVisible();
  await expect(cityCard(page, "珠海市").getByText("档案品种禁养")).toBeVisible();
  // 「其他」/未收录分支：改档案品种=其他 后 Badge 消失（外部 /paws 编辑）
});

test.fixme("E10 @profile-dependency hitting breed can still select with persistent alert", async ({ page }) => {
  // 前置：档案品种=比特犬
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "禁养" });
  await expect(alert).toBeVisible();
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "禁养" })).toBeVisible();
});

test.fixme("E11 @profile-dependency non-hitting breed shows no banned-breed alert", async ({ page }) => {
  // 前置：档案品种=柯基（两城均未禁养）
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "禁养" })).toHaveCount(0);
});