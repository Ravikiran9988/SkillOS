import { expect } from '@playwright/test';

export async function loginAs(page, studentName = 'Aditya Singh') {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const btn = page.getByRole('button', { name: new RegExp(studentName, 'i') });
  await expect(btn).toBeVisible({ timeout: 8000 });
  await btn.click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
}
