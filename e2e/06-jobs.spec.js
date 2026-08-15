import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 6 — Job Recommendations', () => {
  test('should navigate to Jobs and display 3-hop matched jobs with companies and filters', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/jobs');
    await page.waitForLoadState('domcontentloaded');

    // Verify Jobs header
    await expect(page.getByRole('heading', { name: /Jobs That Fit You/i })).toBeVisible();

    // Verify seeded jobs and tier-1 companies render (e.g. OpenAI, Google, Amazon)
    await expect(page.getByText(/OpenAI|Google|Amazon|Meta|Netflix|Stripe/i).first()).toBeVisible();

    // Verify match percentage badge
    await expect(page.getByText(/Match/i).first()).toBeVisible();

    // Test search filter
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Engineer');
    await expect(page.locator('main').getByText(/Engineer/i).first()).toBeVisible();
  });
});
