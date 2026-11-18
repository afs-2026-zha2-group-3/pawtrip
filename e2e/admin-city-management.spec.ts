import { expect, test, type Page } from "@playwright/test";

const initialPolicies = {
  allowedPetTypes: "CAT,DOG",
  maxPetsPerPerson: 2,
  maxSinglePetWeightKg: 10,
  maxSinglePetShoulderHeightCm: 38.25,
  leashRequired: true,
  vaccinationProofRequired: false,
  extraFeeCents: 500,
  reservationRequired: true,
};

function city(
  adcode: string,
  name: string,
  level: "city" | "province",
  provinceAdcode: string,
  provinceName: string,
) {
  return { adcode, name, level, provinceAdcode, provinceName, petPolicies: initialPolicies };
}

const baseCities = [
  city("320100", "南京市", "city", "320000", "江苏省"),
  city("320200", "无锡市", "city", "320000", "江苏省"),
  city("320300", "徐州市", "city", "320000", "江苏省"),
  city("320400", "常州市", "city", "320000", "江苏省"),
  city("320500", "苏州市", "city", "320000", "江苏省"),
  city("320600", "南通市", "city", "320000", "江苏省"),
  city("320700", "连云港市", "city", "320000", "江苏省"),
  city("320800", "淮安市", "city", "320000", "江苏省"),
  city("320900", "盐城市", "city", "320000", "江苏省"),
  city("321000", "扬州市", "city", "320000", "江苏省"),
  city("110000", "北京市", "province", "110000", "北京市"),
];

const dogBreeds = [
  { id: 1, name: "中华田园犬", officialAggressive: true },
  { id: 2, name: "拉布拉多", officialAggressive: false },
  { id: 3, name: "柯基", officialAggressive: false },
];

async function mockUser(page: Page, role: "USER" | "ADMIN" | null) {
  await page.route("**/api/auth/me", async (route) => {
    if (role === null) {
      await route.fulfill({
        status: 401,
        contentType: "application/problem+json",
        body: JSON.stringify({
          status: 401,
          title: "Unauthorized",
          detail: "Authentication is required.",
          code: "UNAUTHENTICATED",
        }),
      });
      return;
    }

    await route.fulfill({
      headers: { "Set-Cookie": "XSRF-TOKEN=e2e-token; Path=/; SameSite=Lax" },
      json: { username: role.toLowerCase(), role },
    });
  });
}

async function mockAdminCities(page: Page) {
  const listRequests: URL[] = [];

  await page.route("**/api/admin/regions", async (route) => {
    await route.fulfill({
      json: [
        { adcode: "110000", name: "北京市", level: "province", children: [] },
        {
          adcode: "320000",
          name: "江苏省",
          level: "province",
          children: [
            { adcode: "320100", name: "南京市", level: "city", children: [] },
          ],
        },
      ],
    });
  });

  await page.route("**/api/dog-breeds", async (route) => {
    await route.fulfill({ json: dogBreeds });
  });

  await page.route(/\/api\/admin\/cities(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    listRequests.push(url);
    const provinceAdcode = url.searchParams.get("provinceAdcode");
    const level = url.searchParams.get("level");
    const keyword = url.searchParams.get("keyword");
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");

    let filtered = baseCities;
    if (provinceAdcode) {
      filtered = filtered.filter((item) => item.provinceAdcode === provinceAdcode);
    }
    if (level) {
      filtered = filtered.filter((item) => item.level === level);
    }
    if (keyword) {
      filtered = filtered.filter((item) => item.name.includes(keyword));
    }
    const start = (pageNumber - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    await route.fulfill({
      json: {
        page: pageNumber,
        pageSize,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasNext: start + pageSize < filtered.length,
        hasPrevious: pageNumber > 1,
        items,
      },
    });
  });

  return listRequests;
}

test("lists cities and province leaves, filters and paginates", async ({ page }) => {
  await mockUser(page, "ADMIN");
  const listRequests = await mockAdminCities(page);
  const amapRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/amap")) {
      amapRequests.push(request.url());
    }
  });

  await page.goto("/admin/cities");
  await expect(page.getByRole("heading", { name: "城市管理", level: 1 })).toBeVisible();
  await expect(page.getByRole("cell", { name: "南京市", exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /北京市/ })).toHaveCount(0);
  await expect(page.getByText("共 11 条 · 第 1 / 2 页")).toBeVisible();

  await page.getByRole("button", { name: "下一页" }).click();
  await expect.poll(() => listRequests.at(-1)?.searchParams.get("page")).toBe("2");
  await expect(page.getByRole("row", { name: /北京市/ })).toBeVisible();
  await expect(page.getByText("共 11 条 · 第 2 / 2 页")).toBeVisible();
  await page.getByRole("button", { name: "上一页" }).click();
  await expect(page.getByRole("cell", { name: "南京市", exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "级别筛选" }).click();
  await page.getByRole("option", { name: "省级叶节点", exact: true }).click();
  await expect.poll(() => listRequests.at(-1)?.searchParams.get("level")).toBe("province");
  await expect(page.getByRole("row", { name: /北京市/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: "南京市", exact: true })).toHaveCount(0);

  await page.getByRole("combobox", { name: "级别筛选" }).click();
  await page.getByRole("option", { name: "全部级别", exact: true }).click();
  await page.getByRole("combobox", { name: "省份筛选" }).click();
  await page.getByRole("option", { name: "江苏省", exact: true }).click();
  await expect.poll(() => listRequests.at(-1)?.searchParams.get("provinceAdcode")).toBe("320000");
  await expect(page.getByRole("cell", { name: "南京市", exact: true })).toBeVisible();

  await page.getByLabel("搜索城市").fill("南京");
  await expect.poll(() => listRequests.at(-1)?.searchParams.get("keyword")).toBe("南京");
  await expect(page.getByRole("cell", { name: "南京市", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "苏州市", exact: true })).toHaveCount(0);
  expect(amapRequests).toHaveLength(0);
});

test("edits city policies and allowed dog breeds without calling Amap", async ({ page }) => {
  await mockUser(page, "ADMIN");
  await mockAdminCities(page);
  const amapRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/amap")) {
      amapRequests.push(request.url());
    }
  });

  let currentDetail = {
    ...baseCities[0],
    allowedDogBreedIds: [1, 2],
  };
  const patchBodies: unknown[] = [];
  await page.route("**/api/admin/cities/320100", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: currentDetail });
      return;
    }
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as {
        petPolicies: typeof initialPolicies;
        allowedDogBreedIds: number[];
      };
      patchBodies.push(body);
      currentDetail = {
        ...currentDetail,
        petPolicies: body.petPolicies,
        allowedDogBreedIds: body.allowedDogBreedIds,
      };
      await route.fulfill({ json: currentDetail });
      return;
    }
    await route.fallback();
  });

  await page.goto("/admin/cities");
  await page.getByRole("button", { name: "编辑 南京市" }).click();

  const dialog = page.getByRole("dialog", { name: "南京市" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("猫和狗");
  await expect(dialog.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("38.25");
  await expect(dialog.getByRole("checkbox", { name: "中华田园犬" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "拉布拉多" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "柯基" })).not.toBeChecked();

  await dialog.getByLabel("单只宠物最大肩高（cm）").fill("38.251");
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "单只宠物最大肩高必须为不小于 0 且最多两位小数的数字。",
  );
  expect(patchBodies).toHaveLength(0);

  await dialog.getByLabel("单只宠物最大肩高（cm）").fill("40.25");
  await dialog.getByRole("combobox", { name: "允许宠物类型" }).click();
  await page.getByRole("option", { name: "仅狗", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "中华田园犬" }).click();
  await dialog.getByRole("checkbox", { name: "柯基" }).click();
  await dialog.getByRole("button", { name: "保存修改" }).click();

  await expect(dialog.getByText("城市政策已更新。", { exact: true })).toBeVisible();
  expect(patchBodies).toHaveLength(1);
  expect(patchBodies[0]).toEqual({
    petPolicies: {
      ...initialPolicies,
      allowedPetTypes: "DOG",
      maxSinglePetShoulderHeightCm: 40.25,
    },
    allowedDogBreedIds: [2, 3],
  });
  expect(amapRequests).toHaveLength(0);

  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "编辑 南京市" }).click();
  const reopened = page.getByRole("dialog", { name: "南京市" });
  await expect(reopened.getByRole("combobox", { name: "允许宠物类型" })).toContainText("仅狗");
  await expect(reopened.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("40.25");
  await expect(reopened.getByRole("checkbox", { name: "中华田园犬" })).not.toBeChecked();
  await expect(reopened.getByRole("checkbox", { name: "柯基" })).toBeChecked();
});

test("USER is redirected away from the admin city route", async ({ page }) => {
  await mockUser(page, "USER");
  await page.goto("/admin/cities");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "城市管理", level: 1 })).toHaveCount(0);
});
