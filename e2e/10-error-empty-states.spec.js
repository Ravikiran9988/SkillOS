import { test, expect } from '@playwright/test';

test.describe('E2E Test 10 — Error & Empty States Handling', () => {
  test('should handle skill-less student (student-20) gracefully without crashing', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Click Mohan Das demo card (0 skills clean slate)
    await page.getByRole('button', { name: /Mohan Das/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify student name is rendered in heading
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mohan Das/i })).toBeVisible();

    // Navigate to Skills with student-20
    await page.getByRole('link', { name: /My Skills/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/No skills in portfolio|Add your first/i).first()).toBeVisible();

    // Navigate to Jobs with student-20
    await page.getByRole('link', { name: /Job Matches/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/No matching job openings|Add more verified skills/i).first()).toBeVisible();
  });

  test('should handle invalid career route with a clean error state', async ({ page }) => {
    await page.goto('/career/invalid-nonexistent-career-id-9999');
    await page.waitForLoadState('domcontentloaded');

    // Verify clean ErrorState component renders with error message
    await expect(page.getByText(/not found|Something went wrong|Career role not found/i).first()).toBeVisible();
  });
});
