import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

const defaultSavedPetPolicies = {
  allowedPetTypes: "CAT,DOG",
  maxPetsPerPerson: 1,
  maxSinglePetWeightKg: 8.75,
  maxSinglePetShoulderHeightCm: 38.25,
  leashRequired: true,
  vaccinationProofRequired: false,
  extraFeeCents: 1050,
  reservationRequired: null,
};

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

async function mockAdminLocationLists(page: Page) {
  const listRequests = { amap: 0, saved: 0 };
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/admin/locations/amap") listRequests.amap += 1;
    if (pathname === "/api/locations") listRequests.saved += 1;
  });

  await page.route("**/api/admin/regions", async (route) => {
    await route.fulfill({
      json: [
        {
          adcode: "110000",
          name: "北京市",
          level: "PROVINCE",
          children: [],
        },
        {
          adcode: "320000",
          name: "江苏省",
          level: "PROVINCE",
          children: [
            {
              adcode: "320100",
              name: "南京市",
              level: "CITY",
              children: [],
            },
          ],
        },
      ],
    });
  });

  await page.route("**/api/locations/types", async (route) => {
    await route.fulfill({
      json: [
        { key: "attraction", label: "景点", typeCodes: ["110000"] },
        { key: "hotel", label: "住宿", typeCodes: ["100000"] },
        { key: "pet-hospital", label: "宠物医院", typeCodes: ["090700"] },
        { key: "pet-supplies", label: "宠物用品店", typeCodes: ["061211"] },
        { key: "restaurant", label: "餐厅", typeCodes: ["050000"] },
      ],
    });
  });

  await page.route(/\/api\/admin\/locations\/amap(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await fulfillAmapPage(route);
  });

  await page.route(/\/api\/locations(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await fulfillSavedPage(route);
  });

  return listRequests;
}

async function fulfillAmapPage(route: Route) {
  const url = new URL(route.request().url());
  const pageNumber = Number(url.searchParams.get("page") ?? "1");
  const regionCode = url.searchParams.get("regionCode");
  const regionName = regionCode === "320100"
    ? "南京市"
    : regionCode === "110000" ? "北京市" : "全部地区";
  const items = pageNumber === 1
    ? [
        {
          poiId: "candidate-saved",
          name: `${regionName}已保存景点`,
          typeCode: "110000",
          address: "南京市中山路 1 号",
          location: "118.78,32.04",
          regionCode,
          saved: true,
          poi: {},
        },
        {
          poiId: "candidate-new",
          name: `${regionName}未保存景点`,
          typeCode: "110000",
          address: "南京市中山路 2 号",
          location: "118.79,32.05",
          regionCode,
          saved: false,
          poi: {},
        },
      ]
    : [
        {
          poiId: "candidate-page-two",
          name: `${regionName}第二页景点`,
          typeCode: "110000",
          address: "南京市中山路 3 号",
          location: "118.80,32.06",
          regionCode,
          saved: false,
          poi: {},
        },
      ];

  await route.fulfill({
    json: {
      items,
      page: pageNumber,
      pageSize: 10,
      totalElements: 15,
      totalPages: 2,
      hasNext: pageNumber === 1,
      hasPrevious: pageNumber > 1,
    },
  });
}

async function selectNanjingCity(page: Page) {
  await page.getByRole("button", { name: "城市筛选" }).click();
  const jiangsuProvince = page.locator("summary").filter({ hasText: "江苏省" });
  await expect(jiangsuProvince).toBeVisible();
  await expect(page.getByRole("button", { name: "南京市", exact: true })).toBeHidden();
  await jiangsuProvince.click();
  await expect(page.getByRole("button", { name: "南京市", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "南京市", exact: true }).click();
}

async function selectPolicyTriState(
  page: Page,
  dialog: Locator,
  label: string,
  option: "未配置" | "需要" | "不需要",
) {
  await dialog.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function selectAllowedPetTypes(
  page: Page,
  dialog: Locator,
  option: "未配置" | "仅猫" | "仅狗" | "猫和狗",
) {
  await dialog.getByRole("combobox", { name: "允许宠物类型" }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function fulfillSavedPage(route: Route) {
  const url = new URL(route.request().url());
  const pageNumber = Number(url.searchParams.get("page") ?? "1");
  const regionCode = url.searchParams.get("regionCode");
  const regionName = regionCode === "320100"
    ? "南京市"
    : regionCode === "110000" ? "北京市" : "全部地区";
  const items = pageNumber === 1
    ? [
        {
          poiId: "saved-one",
          name: `${regionName}Pawtrip地点一`,
          typeCode: "110000",
          typeGroup: "attraction",
          address: "南京市中山路 1 号",
          longitude: 118.78,
          latitude: 32.04,
          regionCode,
          minVisitHours: 1,
          maxVisitHours: 3,
          maxPetsPerPerson: defaultSavedPetPolicies.maxPetsPerPerson,
          petPolicies: defaultSavedPetPolicies,
        },
      ]
    : [
        {
          poiId: "saved-two",
          name: `${regionName}Pawtrip地点二`,
          typeCode: "110000",
          typeGroup: "attraction",
          address: "南京市中山路 2 号",
          longitude: 118.79,
          latitude: 32.05,
          regionCode,
          minVisitHours: null,
          maxVisitHours: null,
          maxPetsPerPerson: defaultSavedPetPolicies.maxPetsPerPerson,
          petPolicies: defaultSavedPetPolicies,
        },
      ];

  await route.fulfill({
    json: {
      items,
      page: pageNumber,
      pageSize: 10,
      totalElements: 11,
      totalPages: 2,
      hasNext: pageNumber === 1,
      hasPrevious: pageNumber > 1,
    },
  });
}

test("ADMIN sees the location tab and can filter and paginate both server tables", async ({
  page,
}) => {
  await mockUser(page, "ADMIN");
  const listRequests = await mockAdminLocationLists(page);

  await page.goto("/");
  const navigationTab = page.getByRole("tab", { name: "地点管理" });
  await expect(navigationTab).toBeVisible();
  await navigationTab.click();

  await expect(page).toHaveURL(/\/admin\/locations$/);
  await expect(page.locator("main").getByRole("heading", { name: "地点管理" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "所有地点" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "pawtrip地点" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "地点名称" })).toBeVisible();
  await expect(page.getByText("请选择城市后查询")).toBeVisible();
  expect(listRequests.amap).toBe(0);
  await expect(page.getByRole("combobox", { name: "地点类型筛选" })).toContainText("景点");
  await page.getByRole("combobox", { name: "地点类型筛选" }).click();
  for (const label of ["景点", "住宿", "宠物医院", "宠物用品店", "餐厅"]) {
    await expect(page.getByRole("option", { name: label })).toBeVisible();
  }
  await page.keyboard.press("Escape");

  const firstAmapPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/admin/locations/amap" && url.searchParams.get("page") === "1";
  });
  await selectNanjingCity(page);
  const firstAmapUrl = new URL((await firstAmapPage).url());
  expect(firstAmapUrl.searchParams.get("typeGroup")).toBe("attraction");
  expect(firstAmapUrl.searchParams.get("regionCode")).toBe("320100");
  await expect(page.getByRole("cell", { name: "南京市已保存景点", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "已添加到 Pawtrip" })).toBeVisible();

  const amapSecondPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/admin/locations/amap" && url.searchParams.get("page") === "2";
  });
  await page.getByRole("button", { name: "下一页" }).click();
  expect(new URL((await amapSecondPage).url()).searchParams.get("page")).toBe("2");
  await expect(page.getByRole("cell", { name: "南京市第二页景点", exact: true })).toBeVisible();

  const filteredAmapPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/admin/locations/amap"
      && url.searchParams.get("regionCode") === "110000"
      && url.searchParams.get("page") === "1";
  });
  await page.getByRole("button", { name: "城市筛选" }).click();
  await page.getByRole("button", { name: "北京市", exact: true }).click();
  expect(new URL((await filteredAmapPage).url()).searchParams.get("regionCode")).toBe("110000");
  await expect(page.getByRole("cell", { name: "北京市未保存景点", exact: true })).toBeVisible();

  const savedFirstPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/locations"
      && url.searchParams.get("page") === "1"
      && url.searchParams.get("regionCode") === "110000";
  });
  await page.getByRole("tab", { name: "pawtrip地点" }).click();
  await savedFirstPage;
  await expect(page.getByRole("columnheader", { name: "最少游玩时间（小时）" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "北京市Pawtrip地点一", exact: true })).toBeVisible();

  const savedSecondPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/locations" && url.searchParams.get("page") === "2";
  });
  await page.getByRole("button", { name: "下一页" }).click();
  expect(new URL((await savedSecondPage).url()).searchParams.get("page")).toBe("2");
  await expect(page.getByRole("cell", { name: "北京市Pawtrip地点二", exact: true })).toBeVisible();
});

test("saving an Amap candidate validates visit hours and updates the current row without refetching", async ({
  page,
}) => {
  await mockUser(page, "ADMIN");
  const listRequests = await mockAdminLocationLists(page);
  let createCalls = 0;
  let createBody: Record<string, unknown> | undefined;
  await page.route("**/api/admin/locations", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    createCalls += 1;
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      json: {
        poiId: "candidate-new",
        typeGroup: "attraction",
        minVisitHours: 2,
        maxVisitHours: 4,
        petPolicies: {
          allowedPetTypes: "CAT,DOG",
          maxPetsPerPerson: 1,
          maxSinglePetWeightKg: 8.75,
          maxSinglePetShoulderHeightCm: 38.25,
          leashRequired: true,
          vaccinationProofRequired: false,
          extraFeeCents: 1050,
          reservationRequired: null,
        },
        poi: { id: "candidate-new", name: "南京市未保存景点", address: "南京市中山路 2 号" },
        business: { tel: "025-12345678", detail: { source: "database" } },
        photos: [],
      },
    });
  });

  await page.goto("/admin/locations");
  await expect(page.getByText("请选择城市后查询")).toBeVisible();
  expect(listRequests.amap).toBe(0);
  await selectNanjingCity(page);
  await expect(page.getByRole("cell", { name: "南京市未保存景点", exact: true })).toBeVisible();
  const initialAmapRequests = listRequests.amap;
  await page.getByRole("button", { name: "编辑 南京市未保存景点" }).click();

  const dialog = page.getByRole("dialog", { name: "保存地点" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("地点名称")).toBeVisible();
  await expect(dialog.getByText("商业信息")).toHaveCount(0);
  await expect(dialog.getByText("地点照片")).toHaveCount(0);
  await dialog.getByLabel("最少游玩时间（小时）").fill("3.5");
  await dialog.getByLabel("最多游玩时间（小时）").fill("4");
  await dialog.getByRole("button", { name: "保存地点" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("游玩时间必须为不小于 0 的整数小时。");
  expect(createCalls).toBe(0);

  await dialog.getByLabel("最少游玩时间（小时）").fill("3");
  await dialog.getByLabel("最多游玩时间（小时）").fill("1");
  await dialog.getByRole("button", { name: "保存地点" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("最少游玩时间不能大于最多游玩时间。");
  expect(createCalls).toBe(0);

  await dialog.getByRole("button", { name: "取消" }).click();
  await page.getByRole("button", { name: "编辑 南京市未保存景点" }).click();
  const policyDialog = page.getByRole("dialog", { name: "保存地点" });
  await expect(policyDialog).toBeVisible();
  await policyDialog.getByLabel("最少游玩时间（小时）").fill("3");
  await policyDialog.getByLabel("最多游玩时间（小时）").fill("4");

  await policyDialog.getByLabel("每位游客最多携带宠物数（只）").fill("1.5");
  await policyDialog.getByRole("button", { name: "保存地点" }).click();
  await expect(policyDialog.getByRole("alert")).toHaveText("每位游客最多携带宠物数必须为不小于 0 的整数。");
  expect(createCalls).toBe(0);
  await policyDialog.getByLabel("每位游客最多携带宠物数（只）").fill("1");

  await policyDialog.getByLabel("单只宠物最大体重（kg）").fill("8.751");
  await policyDialog.getByRole("button", { name: "保存地点" }).click();
  await expect(policyDialog.getByRole("alert")).toHaveText("单只宠物最大体重必须为不小于 0 且最多两位小数的数字。");
  expect(createCalls).toBe(0);
  await policyDialog.getByLabel("单只宠物最大体重（kg）").fill("8.75");

  await policyDialog.getByLabel("额外费用（元 / 只 / 次）").fill("10.001");
  await policyDialog.getByRole("button", { name: "保存地点" }).click();
  await expect(policyDialog.getByRole("alert")).toHaveText("额外费用必须为不小于 0 且最多两位小数的金额。");
  expect(createCalls).toBe(0);
  await policyDialog.getByLabel("额外费用（元 / 只 / 次）").fill("10.5");

  await policyDialog.getByLabel("单只宠物最大肩高（cm）").fill("38.251");
  await policyDialog.getByRole("button", { name: "保存地点" }).click();
  await expect(policyDialog.getByRole("alert")).toHaveText(
    "单只宠物最大肩高必须为不小于 0 且最多两位小数的数字。",
  );
  expect(createCalls).toBe(0);
  await policyDialog.getByLabel("单只宠物最大肩高（cm）").fill("38.25");

  await selectAllowedPetTypes(page, policyDialog, "猫和狗");
  await selectPolicyTriState(page, policyDialog, "牵引绳要求", "需要");
  await selectPolicyTriState(page, policyDialog, "疫苗证明要求", "不需要");

  await policyDialog.getByRole("button", { name: "保存地点" }).click();
  await expect(policyDialog).toHaveCount(0);
  expect(createCalls).toBe(1);
  expect(createBody).toMatchObject({
    poiId: "candidate-new",
    typeGroup: "attraction",
    minVisitHours: 3,
    maxVisitHours: 4,
    petPolicies: {
      allowedPetTypes: "CAT,DOG",
      maxPetsPerPerson: 1,
      maxSinglePetWeightKg: 8.75,
      maxSinglePetShoulderHeightCm: 38.25,
      leashRequired: true,
      vaccinationProofRequired: false,
      extraFeeCents: 1050,
      reservationRequired: null,
    },
  });
  await expect(page.getByRole("row", { name: /南京市未保存景点/ }).getByText("已添加到 Pawtrip")).toBeVisible();
  await expect(page.getByRole("button", { name: "编辑 南京市未保存景点" })).toBeDisabled();
  await expect.poll(() => listRequests.amap).toBe(initialAmapRequests);
  await expect(page.getByText("第 1 页", { exact: true })).toBeVisible();
});

test("saved location details use direct photo URLs and preserve the current list page", async ({
  page,
}) => {
  await mockUser(page, "ADMIN");
  const listRequests = await mockAdminLocationLists(page);
  let detailReads = 0;
  let photoApiCalls = 0;
  let directImageRequests = 0;
  const updatedPetPolicies = {
    allowedPetTypes: "DOG",
    maxPetsPerPerson: 2,
    maxSinglePetWeightKg: 12.5,
    maxSinglePetShoulderHeightCm: 42.5,
    leashRequired: false,
    vaccinationProofRequired: true,
    extraFeeCents: 2000,
    reservationRequired: true,
  };
  const clearedPetPolicies = { ...updatedPetPolicies, allowedPetTypes: null, extraFeeCents: null };
  const updatedDetail = savedDetail(4, 6, updatedPetPolicies);
  const clearedDetail = savedDetail(4, 6, clearedPetPolicies);
  const patchBodies: unknown[] = [];
  let currentDetail = savedDetail(null, null);
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith("/api/admin/locations/saved-two/photos/")) photoApiCalls += 1;
  });
  await page.route("https://images.example.test/photo.jpg", async (route) => {
    directImageRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lpcAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });
  await page.route("https://images.example.test/missing.jpg", async (route) => {
    await route.abort();
  });
  await page.route("**/api/admin/locations/saved-two", async (route) => {
    if (route.request().method() === "GET") {
      detailReads += 1;
      await route.fulfill({ json: currentDetail });
      return;
    }
    if (route.request().method() === "PATCH") {
      patchBodies.push(route.request().postDataJSON());
      currentDetail = patchBodies.length === 1 ? updatedDetail : clearedDetail;
      await route.fulfill({ json: currentDetail });
      return;
    }
    await route.fallback();
  });

  await page.goto("/admin/locations");
  await page.getByRole("tab", { name: "pawtrip地点" }).click();
  await expect(page.getByRole("cell", { name: "全部地区Pawtrip地点一", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page.getByRole("cell", { name: "全部地区Pawtrip地点二", exact: true })).toBeVisible();

  const savedListReads = listRequests.saved;
  const amapListReads = listRequests.amap;
  await page.getByRole("button", { name: "编辑 全部地区Pawtrip地点二" }).click();
  const dialog = page.getByRole("dialog", { name: "数据库景点详情" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/DB 商业信息/)).toBeVisible();
  await expect(dialog.getByText(/完整的 POI 扩展字段/)).toBeVisible();
  await expect(dialog.getByRole("img", { name: "主照片" })).toBeVisible();
  await expect(dialog.getByRole("img", { name: "主照片" })).toHaveAttribute(
    "src",
    "https://images.example.test/photo.jpg",
  );
  await expect(dialog.getByText("图片暂不可用。")).toBeVisible();
  expect(detailReads).toBeGreaterThan(0);
  await expect(page.getByText("共 11 条 · 第 2 / 2 页")).toBeVisible();

  await expect(dialog.getByLabel("每位游客最多携带宠物数（只）")).toHaveValue("1");
  await expect(dialog.getByLabel("单只宠物最大体重（kg）")).toHaveValue("8.75");
  await expect(dialog.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("38.25");
  await expect(dialog.getByLabel("额外费用（元 / 只 / 次）")).toHaveValue("10.5");
  await expect(dialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("猫和狗");
  await expect(dialog.getByRole("combobox", { name: "牵引绳要求" })).toContainText("需要");
  await expect(dialog.getByRole("combobox", { name: "疫苗证明要求" })).toContainText("不需要");
  await expect(dialog.getByRole("combobox", { name: "预约要求" })).toContainText("未配置");

  await dialog.getByLabel("每位游客最多携带宠物数（只）").fill("2");
  await dialog.getByLabel("单只宠物最大体重（kg）").fill("12.5");
  await dialog.getByLabel("单只宠物最大肩高（cm）").fill("42.5");
  await dialog.getByLabel("额外费用（元 / 只 / 次）").fill("20");
  await selectAllowedPetTypes(page, dialog, "仅狗");
  await selectPolicyTriState(page, dialog, "牵引绳要求", "不需要");
  await selectPolicyTriState(page, dialog, "疫苗证明要求", "需要");
  await selectPolicyTriState(page, dialog, "预约要求", "需要");

  await dialog.getByLabel("最少游玩时间（小时）").fill("4");
  await dialog.getByLabel("最多游玩时间（小时）").fill("6");
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByText("地点信息已更新。", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("最少游玩时间（小时）")).toHaveValue("4");
  await expect(dialog.getByLabel("最多游玩时间（小时）")).toHaveValue("6");
  await expect(dialog.getByLabel("每位游客最多携带宠物数（只）")).toHaveValue("2");
  await expect(dialog.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("42.5");
  await expect(dialog.getByLabel("额外费用（元 / 只 / 次）")).toHaveValue("20");
  await expect(dialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("仅狗");
  await expect(dialog.getByRole("combobox", { name: "预约要求" })).toContainText("需要");
  expect(patchBodies).toEqual([{
    minVisitHours: 4,
    maxVisitHours: 6,
    petPolicies: updatedPetPolicies,
  }]);
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  const savedRow = page.getByRole("row", { name: /全部地区Pawtrip地点二/ });
  await expect(savedRow).toContainText("4");
  await expect(savedRow).toContainText("6");
  await expect(page.getByText("共 11 条 · 第 2 / 2 页")).toBeVisible();

  await page.getByRole("button", { name: "编辑 全部地区Pawtrip地点二" }).click();
  const reopenedDialog = page.getByRole("dialog", { name: "数据库景点详情" });
  await expect(reopenedDialog.getByLabel("最少游玩时间（小时）")).toHaveValue("4");
  await expect(reopenedDialog.getByLabel("每位游客最多携带宠物数（只）")).toHaveValue("2");
  await expect(reopenedDialog.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("42.5");
  await expect(reopenedDialog.getByLabel("额外费用（元 / 只 / 次）")).toHaveValue("20");
  await expect(reopenedDialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("仅狗");
  await expect(reopenedDialog.getByRole("combobox", { name: "预约要求" })).toContainText("需要");
  await expect(reopenedDialog.getByRole("img", { name: "主照片" })).toHaveAttribute(
    "src",
    "https://images.example.test/photo.jpg",
  );
  await expect(reopenedDialog.getByRole("button", { name: /获取图片|重试/ })).toHaveCount(0);

  await reopenedDialog.getByLabel("额外费用（元 / 只 / 次）").fill("");
  await selectAllowedPetTypes(page, reopenedDialog, "未配置");
  await reopenedDialog.getByRole("button", { name: "保存修改" }).click();
  await expect(reopenedDialog.getByText("地点信息已更新。", { exact: true })).toBeVisible();
  await expect(reopenedDialog.getByLabel("额外费用（元 / 只 / 次）")).toHaveValue("");
  await expect(reopenedDialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("未配置");
  expect(patchBodies).toEqual([
    { minVisitHours: 4, maxVisitHours: 6, petPolicies: updatedPetPolicies },
    { minVisitHours: 4, maxVisitHours: 6, petPolicies: clearedPetPolicies },
  ]);

  expect(directImageRequests).toBeGreaterThan(0);
  expect(photoApiCalls).toBe(0);
  await expect.poll(() => listRequests.saved).toBe(savedListReads);
  await expect.poll(() => listRequests.amap).toBe(amapListReads);
});

test("non-attraction saved locations still expose pet policy editing", async ({ page }) => {
  await mockUser(page, "ADMIN");
  await mockAdminLocationLists(page);
  const petPolicies = {
    allowedPetTypes: "CAT",
    maxPetsPerPerson: 2,
    maxSinglePetWeightKg: 6.5,
    maxSinglePetShoulderHeightCm: 28.5,
    leashRequired: false,
    vaccinationProofRequired: true,
    extraFeeCents: 300,
    reservationRequired: false,
  };
  let patchBody: unknown;
  await page.route(/\/api\/locations(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      json: {
        items: [{
          poiId: "saved-non-attraction",
          name: "全部地区非景点",
          typeCode: "050000",
          typeGroup: "hotel",
          address: "南京市中山路 9 号",
          longitude: 118.78,
          latitude: 32.04,
          regionCode: null,
          minVisitHours: null,
          maxVisitHours: null,
          maxPetsPerPerson: petPolicies.maxPetsPerPerson,
          petPolicies,
        }],
        page: 1,
        pageSize: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
  });
  await page.route("**/api/admin/locations/saved-non-attraction", async (route) => {
    const detail = {
      poiId: "saved-non-attraction",
      typeGroup: "hotel",
      minVisitHours: null,
      maxVisitHours: null,
      petPolicies,
      poi: { id: "saved-non-attraction", name: "非景点详情" },
      business: {},
      photos: [],
    };
    if (route.request().method() === "GET") {
      await route.fulfill({ json: detail });
      return;
    }
    if (route.request().method() === "PATCH") {
      patchBody = route.request().postDataJSON();
      await route.fulfill({
        json: { ...detail, petPolicies: { ...petPolicies, extraFeeCents: 350 } },
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/admin/locations");
  await page.getByRole("tab", { name: "pawtrip地点" }).click();
  await expect(page.getByRole("cell", { name: "全部地区非景点", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "编辑 全部地区非景点" }).click();

  const dialog = page.getByRole("dialog", { name: "非景点详情" });
  await expect(dialog.getByText("携宠政策")).toBeVisible();
  await expect(dialog.getByLabel("最少游玩时间（小时）")).toHaveCount(0);
  await expect(dialog.getByLabel("每位游客最多携带宠物数（只）")).toHaveValue("2");
  await expect(dialog.getByLabel("单只宠物最大肩高（cm）")).toHaveValue("28.5");
  await expect(dialog.getByRole("combobox", { name: "允许宠物类型" })).toContainText("仅猫");
  await expect(dialog.getByRole("button", { name: "保存修改" })).toBeVisible();

  await dialog.getByLabel("额外费用（元 / 只 / 次）").fill("3.5");
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByText("地点信息已更新。", { exact: true })).toBeVisible();
  expect(patchBody).toEqual({
    petPolicies: { ...petPolicies, extraFeeCents: 350 },
  });
});

test("USER is redirected away from the admin location route", async ({ page }) => {
  await mockUser(page, "USER");
  await page.goto("/admin/locations");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("main").getByRole("heading", { name: "地点管理" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "地点管理" })).toHaveCount(0);
});

function savedDetail(
  minVisitHours: number | null,
  maxVisitHours: number | null,
  petPolicies = defaultSavedPetPolicies,
) {
  return {
    poiId: "saved-two",
    typeGroup: "attraction",
    minVisitHours,
    maxVisitHours,
    petPolicies,
    poi: {
      id: "saved-two",
      name: "数据库景点详情",
      address: "数据库地址",
      extension: { note: "完整的 POI 扩展字段" },
    },
    business: { name: "DB 商业信息", tel: "025-98765432" },
    photos: [
      {
        photoId: 7,
        order: 0,
        title: "主照片",
        sourceUrl: "https://images.example.test/photo.jpg",
        metadata: { url: "https://images.example.test/photo.jpg", custom: "保留元数据" },
      },
      {
        photoId: 8,
        order: 1,
        title: "失效来源",
        sourceUrl: "https://images.example.test/missing.jpg",
        metadata: { url: "https://images.example.test/missing.jpg" },
      },
    ],
  };
}

test("anonymous visitors are redirected to login from the admin location route", async ({
  page,
}) => {
  await mockUser(page, null);
  await page.goto("/admin/locations");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { name: "地点管理" })).toHaveCount(0);
});
