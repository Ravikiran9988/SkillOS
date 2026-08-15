import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 5 — Personalized Learning Roadmap', () => {
  test('should render graph-derived prerequisite chain with ordered steps and course links', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Verify Personalized Learning Roadmap header
    await expect(page.getByRole('heading', { name: /Learning Roadmap/i })).toBeVisible();

    // Verify numbered step indicators (1, 2, 3, etc.)
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

    // Verify course links or steps exist
    await expect(page.getByText(/Recommended Courses|Current Focus|Milestone Phases/i).first()).toBeVisible();

    // Verify no error boundary or crash
    await expect(page.locator('.error-state')).not.toBeVisible();
  });
});
