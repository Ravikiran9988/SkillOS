import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 3 — Career Explorer & Track Matching', () => {
  test('should navigate to Careers, filter tracks, and open Career Detail', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/careers');
    await page.waitForLoadState('domcontentloaded');

    // Verify Career Explorer heading
    await expect(page.getByRole('heading', { name: /Career Explorer/i })).toBeVisible();

    // Test Career Search input
    const searchInput = page.getByPlaceholder(/Search roles/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('AI Researcher');

    // Click on AI Researcher card to open detail
    const aiResearcherCard = page.locator('div:has-text("AI Researcher")').last();
    await aiResearcherCard.click();
    await expect(page).toHaveURL(/\/career\/cr-airesearcher/);
    await page.waitForLoadState('domcontentloaded');

    // Verify Career Detail header
    await expect(page.getByRole('heading', { name: 'AI Researcher' })).toBeVisible();
  });
});
