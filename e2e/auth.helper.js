import { expect } from '@playwright/test';

export async function loginAs(page, studentName = 'Aditya Singh') {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // If on login page, click the quick persona button
  const btn = page.getByRole('button', { name: new RegExp(studentName, 'i') });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8000 }).catch(() => {});
  } else {
    await page.goto('/');
  }
  await page.waitForLoadState('domcontentloaded');
}
