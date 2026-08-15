import { expect } from '@playwright/test';

export async function loginAs(page, studentName = 'Aditya Singh') {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // If redirected to /login, click the 1-click demo persona button
  if (page.url().includes('/login')) {
    const btn = page.getByRole('button', { name: new RegExp(studentName, 'i') });
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }
}
