import { expect } from '@playwright/test';

export async function loginAs(page, studentName = 'Aditya Singh') {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const btn = page.getByRole('button', { name: new RegExp(studentName, 'i') });
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
  }
  await page.waitForLoadState('networkidle');
}
