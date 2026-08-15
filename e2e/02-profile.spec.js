import { test, expect } from '@playwright/test';

test.describe('E2E Test 2 — Student Profile', () => {
  test('should navigate to Profile and display skills, proficiencies, and career goal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for dropdown and select student-5
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Navigate to Profile via sidebar
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await page.waitForLoadState('networkidle');

    // Verify Profile header & details
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    await expect(page.locator('main').getByText('Aditya Singh').first()).toBeVisible();
    await expect(page.getByText('aditya@example.com')).toBeVisible();

    // Verify Target Career is displayed
    await expect(page.locator('main').getByText(/AI Researcher/i).first()).toBeVisible();

    // Verify skills with proficiencies are listed
    await expect(page.locator('main').getByText('Python', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('PyTorch', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('Deep Learning', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('Machine Learning', { exact: true }).first()).toBeVisible();

    // Verify Add Skill form controls are available
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeVisible();
  });
});
