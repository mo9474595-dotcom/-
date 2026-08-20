import { test, expect } from "@playwright/test";
import { registerTeacher, uniqueEmail } from "./helpers";

test("teacher can register, log out, and log back in", async ({ page }) => {
  const { email, password } = await registerTeacher(page);
  await expect(page.locator("h1")).toContainText("امتحاناتي");

  await page.click('button:has-text("تسجيل الخروج")');
  await page.waitForURL("**/teacher/login");

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/teacher/dashboard");
});

test("wrong password is rejected with an Arabic error, not a silent failure", async ({ page }) => {
  const { email } = await registerTeacher(page);
  await page.click('button:has-text("تسجيل الخروج")');
  await page.waitForURL("**/teacher/login");

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "totally-wrong-password");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=البريد الإلكتروني أو كلمة المرور غير صحيحة")).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/login$/);
});

test("registering with an already-used email is rejected", async ({ page }) => {
  const email = uniqueEmail("dup");
  await registerTeacher(page, { email });
  await page.click('button:has-text("تسجيل الخروج")');
  await page.waitForURL("**/teacher/login");

  await page.goto("/teacher/register");
  await page.fill('input[name="name"]', "نسخة أخرى");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=هذا البريد الإلكتروني مسجل بالفعل")).toBeVisible();
});
