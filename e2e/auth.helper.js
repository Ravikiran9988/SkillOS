import { expect } from '@playwright/test';

const STUDENT_EMAILS = {
  'Aditya Singh': 'aditya.singh@example.com',
  'Aarav Sharma': 'aarav.sharma@example.com',
  'Nisha Kapoor': 'nisha.kapoor@example.com',
  'Mohan Das': 'mohan.das@example.com',
};

export async function loginAs(page, studentName = 'Aditya Singh') {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Check if quick demo button is visible (dev/test mode)
  const quickBtn = page.getByRole('button', { name: new RegExp(studentName, 'i') });
  if (await quickBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await quickBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
  } else {
    // Fill credentials form if on login page
    const emailInput = page.locator('#login-email');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const email = STUDENT_EMAILS[studentName] || 'aditya.singh@example.com';
      await emailInput.fill(email);
      await page.locator('#login-password').fill('Password123!');
      await page.getByRole('button', { name: /Continue to SkillOS|Sign In/i }).click();
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
    }
  }

  await page.waitForLoadState('domcontentloaded');
}
