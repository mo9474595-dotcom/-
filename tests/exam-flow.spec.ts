import { test, expect } from "@playwright/test";
import { registerTeacher, uniqueName } from "./helpers";

test("teacher creates an exam, a student takes it, and the score shows up correctly", async ({
  page,
  browser,
}) => {
  await registerTeacher(page);

  // Create the exam
  await page.goto("/teacher/exams/new");
  await page.fill('input[name="title"]', "امتحان اختبار آلي");
  await page.fill('input[name="durationMinutes"]', "20");
  await page.click('button[type="submit"]');
  // Exclude "/teacher/exams/new" itself — it satisfies this same regex.
  await page.waitForURL(
    (url) => /\/teacher\/exams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );
  const examUrl = page.url();

  // Add one multiple-choice question with a known correct answer
  await page.click("text=+ إضافة سؤال");
  await page.fill('textarea', "ما ناتج 2 + 2؟");
  const choiceInputs = page.locator('input[placeholder^="خيار"]');
  await choiceInputs.nth(0).fill("3");
  await choiceInputs.nth(1).fill("4");
  await page.locator('input[name="correctChoice"]').nth(1).check();
  await page.click('button:has-text("إضافة السؤال")');
  await expect(page.locator("text=ما ناتج 2 + 2؟")).toBeVisible();

  // Publish. Generous timeout: this is often the first request to hit this
  // route right after a fresh `next start`, and cold-start compilation of
  // the route can exceed the default 5s assertion timeout.
  await page.click('button:has-text("نشر الامتحان")');
  await expect(page.locator('button:has-text("إلغاء النشر")')).toBeVisible({ timeout: 15000 });

  // Generate one anonymous code
  await page.goto(`${examUrl}/codes`);
  await page.fill('input[type="number"]', "1");
  await page.click('button:has-text("إنشاء الرموز")');
  const code = (await page.locator("tbody tr td.font-mono").first().textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9-]+$/);

  // Student takes the exam in a separate browser context (separate cookies)
  const studentName = uniqueName("طالب");
  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  await studentPage.goto("/exam/join");
  await studentPage.fill('input[name="code"]', code);
  await studentPage.fill('input[name="studentName"]', studentName);
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((url) => /\/exam\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/join"));

  await studentPage.click("text=ابدأ الامتحان بملء الشاشة").catch(() => {});
  await studentPage.waitForSelector('input[type="radio"]');
  // Pick the correct choice ("4") by its visible label text
  await studentPage.locator('label:has-text("4")').first().click();

  // Submission goes through the app's own confirm modal, not a native
  // browser dialog — click its exact confirm button ("تسليم"), not the
  // triggering "تسليم الامتحان" button whose text also contains that word.
  await studentPage.click('button:has-text("تسليم الامتحان")');
  await studentPage.getByRole("button", { name: "تسليم", exact: true }).click();
  await studentPage.waitForURL(/\/submitted$/);
  await expect(studentPage.getByRole("heading", { name: "تم تسليم الامتحان بنجاح" })).toBeVisible();
  await studentCtx.close();

  // Teacher sees a full-score submitted result
  await page.goto(`${examUrl}/results`);
  await expect(page.locator(`tr:has-text("${studentName}")`)).toContainText("تم التسليم");
  await expect(page.locator(`tr:has-text("${studentName}")`)).toContainText("1 / 1");
});

test("teacher can reset a stuck (in-progress) attempt and the code becomes usable again", async ({
  page,
  browser,
}) => {
  await registerTeacher(page);

  await page.goto("/teacher/exams/new");
  await page.fill('input[name="title"]', "امتحان لإعادة التعيين");
  await page.fill('input[name="durationMinutes"]', "20");
  await page.click('button[type="submit"]');
  // Exclude "/teacher/exams/new" itself — it satisfies this same regex.
  await page.waitForURL(
    (url) => /\/teacher\/exams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new")
  );
  const examUrl = page.url();

  await page.click("text=+ إضافة سؤال");
  await page.fill('textarea', "سؤال تجريبي");
  const choiceInputs = page.locator('input[placeholder^="خيار"]');
  await choiceInputs.nth(0).fill("أ");
  await choiceInputs.nth(1).fill("ب");
  await page.locator('input[name="correctChoice"]').nth(0).check();
  await page.click('button:has-text("إضافة السؤال")');

  await page.click('button:has-text("نشر الامتحان")');

  await page.goto(`${examUrl}/codes`);
  await page.fill('input[type="number"]', "1");
  await page.click('button:has-text("إنشاء الرموز")');
  const code = (await page.locator("tbody tr td.font-mono").first().textContent())!.trim();

  // Student starts but never finishes (simulates a crashed browser).
  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  await studentPage.goto("/exam/join");
  await studentPage.fill('input[name="code"]', code);
  await studentPage.fill('input[name="studentName"]', "طالب عالق");
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((url) => /\/exam\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/join"));
  await studentCtx.close();

  // Teacher finds the in-progress attempt and resets it.
  await page.goto(`${examUrl}/results`);
  await page.click('a:has-text("عرض التفاصيل")');
  await page.waitForURL(/\/results\/[^/]+$/);
  await expect(page.locator("text=إعادة تعيين المحاولة")).toBeVisible();

  await page.click('button:has-text("إعادة تعيين المحاولة")');
  await page.click('button:has-text("إعادة تعيين نهائياً")');
  await page.waitForURL(/\/results$/);
  await expect(page.locator("text=لا توجد محاولات بعد.")).toBeVisible();

  // The same code should now be free to use again.
  const retryCtx = await browser.newContext();
  const retryPage = await retryCtx.newPage();
  await retryPage.goto("/exam/join");
  await retryPage.fill('input[name="code"]', code);
  await retryPage.fill('input[name="studentName"]', "طالب عالق (إعادة)");
  await retryPage.click('button[type="submit"]');
  await retryPage.waitForURL((url) => /\/exam\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/join"));
  await retryCtx.close();
});
