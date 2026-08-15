import { test, expect } from '@playwright/test';

test.describe('E2E Test 4 — Student Skill Gap Analysis', () => {
  test('should display prioritized skill gap breakdown for target career', async ({ page }) => {
    await page.goto('/skill-gap');
    await page.waitForLoadState('networkidle');

    // Verify Skill Gap header
    await expect(page.getByRole('heading', { name: /What's Between You & Your Career Goal/i })).toBeVisible();

    // Verify live computed match % (57% for Aditya Singh in live database)
    await expect(page.getByText(/57%/).first()).toBeVisible();

    // Verify Gaps priority sections exist
    await expect(page.getByText(/Priority Gaps/i).first()).toBeVisible();

    // Verify verified skills section
    await expect(page.getByText(/Skills You Already Have/i)).toBeVisible();
    await expect(page.getByText('Python', { exact: true }).first()).toBeVisible();
  });
});
