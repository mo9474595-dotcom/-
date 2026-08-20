import { test, expect } from "@playwright/test";
import { registerTeacher, uniqueName } from "./helpers";

test("deleting a class/exam moves it to trash, hides it, and restore brings it back", async ({
  page,
}) => {
  await registerTeacher(page);

  // Class: create, delete, confirm it's gone, restore, confirm it's back.
  const className = uniqueName("شعبة للحذف");
  await page.goto("/teacher/classes/new");
  await page.fill('input[name="name"]', className);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => /\/teacher\/classes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );

  await page.click('button:has-text("حذف الشعبة")');
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.waitForURL(/\/teacher\/classes$/);
  await expect(page.locator(`text=${className}`)).not.toBeVisible();

  await page.goto("/teacher/trash");
  await expect(page.locator(`text=${className}`)).toBeVisible();
  await page
    .locator("li")
    .filter({ hasText: className })
    .getByRole("button", { name: "استعادة" })
    .click();
  // A success toast that also contains the class name shows briefly, so
  // check the class disappeared from the trash *list item* specifically
  // rather than the whole page.
  await expect(page.locator("li").filter({ hasText: className })).toHaveCount(0);

  await page.goto("/teacher/classes");
  await expect(page.locator(`text=${className}`)).toBeVisible();

  // Exam: same round trip.
  const examTitle = uniqueName("امتحان للحذف");
  await page.goto("/teacher/exams/new");
  await page.fill('input[name="title"]', examTitle);
  await page.fill('input[name="durationMinutes"]', "20");
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => /\/teacher\/exams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );

  await page.click('button:has-text("حذف الامتحان")');
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.waitForURL(/\/teacher\/dashboard$/);
  await expect(page.locator(`text=${examTitle}`)).not.toBeVisible();

  await page.goto("/teacher/trash");
  await expect(page.locator(`text=${examTitle}`)).toBeVisible();
  await page
    .locator("li")
    .filter({ hasText: examTitle })
    .getByRole("button", { name: "استعادة" })
    .click();
  // Wait for the restore request to actually complete before navigating —
  // otherwise page.goto can cancel the in-flight fetch mid-request.
  await expect(page.locator("li").filter({ hasText: examTitle })).toHaveCount(0);

  await page.goto("/teacher/dashboard");
  await expect(page.locator(`text=${examTitle}`)).toBeVisible();
});

test("class CSV export downloads a CSV with the roster", async ({ page, request }) => {
  await registerTeacher(page);

  const className = uniqueName("شعبة للتصدير");
  await page.goto("/teacher/classes/new");
  await page.fill('input[name="name"]', className);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => /\/teacher\/classes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );
  const classUrl = page.url();
  const classId = classUrl.split("/").pop()!;

  const studentName = uniqueName("طالب للتصدير");
  await page.fill("textarea", studentName);
  await page.click('button:has-text("إضافة")');
  await expect(page.locator(`text=${studentName}`).first()).toBeVisible();

  const res = await request.get(`/api/teacher/classes/${classId}/export`, {
    headers: { cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
  });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const body = await res.text();
  expect(body).toContain(studentName);
});

test("full account backup export includes the teacher's classes and exams", async ({ page }) => {
  await registerTeacher(page);

  const className = uniqueName("شعبة للنسخ الاحتياطي");
  await page.goto("/teacher/classes/new");
  await page.fill('input[name="name"]', className);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => /\/teacher\/classes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );

  const examTitle = uniqueName("امتحان للنسخ الاحتياطي");
  await page.goto("/teacher/exams/new");
  await page.fill('input[name="title"]', examTitle);
  await page.fill('input[name="durationMinutes"]', "20");
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => /\/teacher\/exams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );

  const res = await page.request.get("/api/teacher/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  const data = await res.json();
  expect(data.classSections.some((c: { name: string }) => c.name === className)).toBe(true);
  expect(data.exams.some((e: { title: string }) => e.title === examTitle)).toBe(true);
});

test("repeated wrong passwords for one account get locked out even from a fresh IP-equivalent context", async ({
  page,
  request,
}) => {
  const { email } = await registerTeacher(page);
  await page.click('button:has-text("تسجيل الخروج")');
  await page.waitForURL(/\/teacher\/login$/);

  const statuses: number[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await request.post("/api/teacher/login", {
      data: { email, password: "definitely-wrong-password" },
    });
    statuses.push(res.status());
  }
  expect(statuses).toContain(429);
});

test("logout from all devices invalidates a previously-issued session cookie", async ({
  page,
  browser,
}) => {
  await registerTeacher(page);

  // Capture the current session cookie so we can simulate a second device
  // still holding an old token after "logout everywhere" is used.
  const cookiesBefore = await page.context().cookies();
  const sessionCookie = cookiesBefore.find((c) => c.name === "teacher_token")!;
  expect(sessionCookie).toBeTruthy();

  await page.click('button:has-text("من كل الأجهزة")');
  await page.getByRole("button", { name: "تسجيل الخروج من الكل", exact: true }).click();
  await page.waitForURL(/\/teacher\/login$/);

  // A second "device" holding the pre-logout-all cookie should now be
  // rejected as unauthenticated instead of reaching the dashboard.
  const otherDeviceCtx = await browser.newContext();
  await otherDeviceCtx.addCookies([sessionCookie]);
  const otherDevicePage = await otherDeviceCtx.newPage();
  await otherDevicePage.goto("/teacher/dashboard");
  await otherDevicePage.waitForURL(/\/teacher\/login$/);
  await otherDeviceCtx.close();
});
