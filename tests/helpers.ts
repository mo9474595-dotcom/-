import type { Page } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Registers a brand-new teacher account and lands on the dashboard. */
export async function registerTeacher(
  page: Page,
  { name = "أستاذ اختبار", email = uniqueEmail("teacher"), password = "password123" } = {}
) {
  await page.goto("/teacher/register");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/teacher/dashboard");
  return { name, email, password };
}

/**
 * Finds the first link matching a prefix while excluding the "create new"
 * link that shares the same href prefix (e.g. "/teacher/exams/new" vs
 * "/teacher/exams/[id]"). Every list page in this app has this shape, and
 * a naive `a[href^="prefix"]` selector matches both.
 */
export async function firstRealLink(page: Page, hrefPrefix: string, excludeSuffix: string) {
  const links = await page.locator(`a[href^="${hrefPrefix}"]`).all();
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href && href !== `${hrefPrefix}${excludeSuffix}`) return href;
  }
  return null;
}
