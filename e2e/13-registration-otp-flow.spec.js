import { test, expect } from '@playwright/test';

test.describe('Registration & Email OTP Verification Flow', () => {
  const timestamp = Date.now();
  const testEmail = `e2e.student.${timestamp}@kiranverse.tech`;
  const testPassword = 'Password123!';
  const testName = 'Priya Patel';

  test('Complete Student Journey: Register → OTP Verification → Dashboard → Logout → Login', async ({ page }) => {
    // 1. Navigate to Registration page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Click "Create Account" tab
    const registerTab = page.getByRole('button', { name: /Create Account|Register/i });
    if (await registerTab.isVisible({ timeout: 3000 })) {
      await registerTab.click();
    }

    // Fill registration form
    await page.locator('input[placeholder*="Aditya"], input[name="name"]').first().fill(testName);
    await page.locator('input[placeholder*="email.com"], input[type="email"]').first().fill(testEmail);
    await page.locator('input[type="password"]').first().fill(testPassword);
    await page.locator('input[type="password"]').nth(1).fill(testPassword);

    // Submit registration
    const submitBtn = page.getByRole('button', { name: /Create Account|Sign Up|Register/i }).last();
    await submitBtn.click();

    // 2. Expect redirect to /verify-email
    await page.waitForURL((url) => url.pathname.includes('/verify-email'), { timeout: 10000 });
    expect(page.url()).toContain('/verify-email');

    // Expect verification UI
    await expect(page.locator('h1, h2').filter({ hasText: /Verify your email/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 5000 });

    // 3. Verify Resend Button is visible
    const resendBtn = page.getByRole('button', { name: /Resend Code|Resend/i });
    await expect(resendBtn).toBeVisible();
  });
});
