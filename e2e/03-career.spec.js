import { test, expect } from '@playwright/test';

test.describe('E2E Test 3 — Career Explorer & Track Matching', () => {
  test('should navigate to Careers, filter tracks, and open Career Detail', async ({ page }) => {
    await page.goto('/careers');
    await page.waitForLoadState('networkidle');

    // Verify Career Explorer heading
    await expect(page.getByRole('heading', { name: /Find Your Best Career Path/i })).toBeVisible();

    // Test Career Search input
    const searchInput = page.getByPlaceholder(/Search roles/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('AI Researcher');

    // Click on AI Researcher card to open detail
    const aiResearcherCard = page.locator('div:has-text("AI Researcher")').last();
    await aiResearcherCard.click();
    await expect(page).toHaveURL(/\/career\/cr-airesearcher/);
    await page.waitForLoadState('networkidle');

    // Verify Career Detail header
    await expect(page.getByRole('heading', { name: 'AI Researcher' })).toBeVisible();
  });
});
