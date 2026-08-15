import { test, expect } from '@playwright/test';

test.describe('E2E Test 11 — Auth & Student Data Isolation (Security & IDOR Protection)', () => {
  test('should enforce student authentication, prevent IDOR, and isolate student sessions', async ({ page, request }) => {
    // 1. Clear session and navigate to login
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const btn = page.getByRole('button', { name: /Aditya Singh/i });
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify student name rendered on page
    await expect(page.locator('body').getByText(/Aditya Singh/i).first()).toBeVisible();

    // 2. Obtain Student A's JWT token from localStorage
    const tokenA = await page.evaluate(() => localStorage.getItem('skillos_token'));
    expect(tokenA).toBeTruthy();

    // 3. Verify IDOR Prevention: Student A attempting to fetch Student B's (student-1) private endpoint
    const response = await request.get('/api/students/student-1', {
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });

    // Server must reject with 403 Forbidden
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('forbidden');

    // 4. Test Sign Out
    await page.getByRole('button', { name: /Sign Out/i }).first().click();
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
  });
});
