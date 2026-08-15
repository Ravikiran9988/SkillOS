import { test, expect } from '@playwright/test';

test.describe('E2E Test 2 — Student Profile & Skills Portfolio', () => {
  test('should navigate to Profile and Skills and display verified competencies', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify Profile header & details
    await expect(page.getByRole('heading', { name: /My Profile/i })).toBeVisible();
    await expect(page.locator('main').getByText('Aditya Singh').first()).toBeVisible();
    await expect(page.getByText('aditya.singh@example.com')).toBeVisible();

    // Verify Target Career Goal is displayed
    await expect(page.getByText('Primary Target Career Goal', { exact: true })).toBeVisible();

    // Navigate to My Skills via sidebar
    await page.getByRole('link', { name: /My Skills/i }).click();
    await expect(page).toHaveURL(/\/skills/);
    await page.waitForLoadState('networkidle');

    // Verify verified competencies are listed
    await expect(page.locator('main').getByText('Python', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('PyTorch', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('Machine Learning', { exact: true }).first()).toBeVisible();

    // Verify Add Skill button exists
    await expect(page.getByRole('button', { name: /Add Verified Skill/i })).toBeVisible();
  });
});
