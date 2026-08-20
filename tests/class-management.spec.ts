import { test, expect } from "@playwright/test";
import { registerTeacher, uniqueName } from "./helpers";

test("teacher builds a class roster, grades a project, marks attendance, and the student portal reflects it all", async ({
  page,
  browser,
}) => {
  await registerTeacher(page);

  // Create a class
  const className = uniqueName("شعبة");
  await page.goto("/teacher/classes/new");
  await page.fill('input[name="name"]', className);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => /\/teacher\/classes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"));
  const classUrl = page.url();

  // Add one student
  const studentName = uniqueName("طالب");
  await page.fill("textarea", `${studentName}, 999`);
  await page.click('button:has-text("إضافة")');
  await expect(page.locator(`text=${studentName}`).first()).toBeVisible();

  // Grab the student's portal link before doing anything else
  await page.click(`a:has-text("${studentName}")`);
  await page.waitForURL(/\/students\/[^/]+$/);
  const portalUrl = (await page.locator("code").first().textContent())!.trim();

  // Add a manual grade
  await page.click('button:has-text("+ إضافة درجة")');
  const gradeForm = page.locator("form").filter({ has: page.locator('input[name="title"]') });
  await gradeForm.locator('input[name="title"]').fill("اختبار قصير");
  await gradeForm.locator('input[name="score"]').fill("7");
  await gradeForm.locator('input[name="maxScore"]').fill("10");
  await gradeForm.locator('button[type="submit"]').click();
  await expect(page.locator("text=اختبار قصير")).toBeVisible();

  // Create and grade a project
  await page.goto(`${classUrl}/projects`);
  await page.click('button:has-text("+ مشروع جديد")');
  await page.fill('input[name="title"]', "مشروع الاختبار");
  await page.fill('input[name="maxScore"]', "50");
  await page.locator('form button[type="submit"]:has-text("إنشاء")').click();
  await page.click('a:has-text("تصحيح الدرجات")');
  await page.waitForURL(/\/projects\/[^/]+$/);
  const firstScoreInput = page.locator("tbody tr").first().locator('input[type="number"]');
  await firstScoreInput.fill("45");
  await page.locator("tbody tr").first().locator('button:has-text("حفظ")').click();
  await page.waitForTimeout(300);

  // Create an attendance session and mark the student present manually
  await page.goto(`${classUrl}/attendance`);
  await page.click('button:has-text("+ جلسة جديدة")');
  await page.waitForTimeout(300);
  await page.click('a:has-text("تسجيل الحضور")');
  await page.waitForURL(/\/attendance\/[^/]+$/);
  await page
    .locator("div")
    .filter({ hasText: studentName })
    .last()
    .getByRole("button", { name: "حاضر" })
    .click();
  await page.waitForTimeout(300);

  // The student's own portal should now reflect grades, project, and attendance
  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  await studentPage.goto(portalUrl);
  await expect(studentPage.locator(`text=أهلاً ${studentName}`)).toBeVisible();
  await expect(studentPage.locator("text=اختبار قصير")).toBeVisible();
  await expect(studentPage.locator("text=مشروع الاختبار")).toBeVisible();
  await expect(studentPage.locator("text=ترتيبك في الشعبة")).toBeVisible();
  await studentCtx.close();

  // Regenerating the portal link invalidates the old one
  await page.goto(classUrl);
  await page.click(`a:has-text("${studentName}")`);
  await page.waitForURL(/\/students\/[^/]+$/);
  // This goes through the app's own confirm modal, not a native browser
  // dialog — click its real confirm button.
  await page.click('button:has-text("توليد رابط جديد")');
  await page.getByRole("button", { name: "إبطال وتوليد رابط جديد", exact: true }).click();
  await page.waitForTimeout(500);

  const brokenCtx = await browser.newContext();
  const brokenPage = await brokenCtx.newPage();
  const res = await brokenPage.goto(portalUrl);
  expect(res?.status()).toBe(404);
  await brokenCtx.close();
});
