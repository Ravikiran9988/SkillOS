import { test, expect } from '@playwright/test';

test.describe('E2E Test 3 — Career Explorer', () => {
  test('should navigate to Careers, display career progression graph, search, and open detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for selector and select student-5
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Navigate to Careers
    await page.getByRole('link', { name: /careers/i }).click();
    await expect(page).toHaveURL(/\/career$/);
    await page.waitForLoadState('networkidle');

    // Verify Career Explorer heading
    await expect(page.getByRole('heading', { name: 'Career Explorer' })).toBeVisible();

    // Verify Career Progression Paths (LEADS_TO graph)
    await expect(page.getByRole('heading', { name: 'Career Progression Paths' })).toBeVisible();

    // Test Career Search input
    const searchInput = page.getByPlaceholder('Search careers...');
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
