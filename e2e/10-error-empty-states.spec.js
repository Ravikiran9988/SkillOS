import { test, expect } from '@playwright/test';

test.describe('E2E Test 10 — Error & Empty States Handling', () => {
  test('should handle skill-less student (student-20) gracefully without crashing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for student select and select student-20 (Mohan Das, 0 skills)
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-20');
    await page.waitForLoadState('networkidle');

    // Verify student name is rendered in heading and top header
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.locator('h1').getByText('Mohan Das')).toBeVisible();
    await expect(page.locator('header').getByText('Mohan Das')).toBeVisible();

    // Verify 0 skills count is displayed
    await expect(page.locator('header').getByText('0 skills')).toBeVisible();

    // Verify empty state prompt to add skills
    await expect(page.getByText(/No matching career roles found|Add skills/i).first()).toBeVisible();

    // Navigate to Jobs with student-20
    await page.getByRole('link', { name: /jobs/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify empty state message in Jobs
    await expect(page.getByText(/No matching jobs found|No jobs found|Add more skills/i).first()).toBeVisible();

    // Navigate to Graph Explorer with student-20
    await page.getByRole('link', { name: /graph explorer/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify clean empty state or canvas is rendered
    const canvasOrEmpty = page.locator('.react-flow').or(page.getByText(/No graph data/i));
    await expect(canvasOrEmpty.first()).toBeVisible();
  });

  test('should handle invalid career route with a clean error boundary', async ({ page }) => {
    await page.goto('/career/invalid-nonexistent-career-id-9999');
    await page.waitForLoadState('networkidle');

    // Verify clean ErrorState component renders with error message and action button
    await expect(page.getByText(/not found|Something went wrong|Career not found/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Try Again|Back/i }).first()).toBeVisible();
  });
});
