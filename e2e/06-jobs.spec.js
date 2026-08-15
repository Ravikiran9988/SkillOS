import { test, expect } from '@playwright/test';

test.describe('E2E Test 6 — Job Recommendations', () => {
  test('should navigate to Jobs and display 3-hop matched jobs with companies and filters', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure student-5 is selected
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Navigate to Jobs
    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL(/\/jobs/);
    await page.waitForLoadState('networkidle');

    // Verify Jobs header
    await expect(page.getByRole('heading', { name: 'Job Opportunities' })).toBeVisible();

    // Verify filter buttons
    await expect(page.getByRole('button', { name: 'For Me' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All Jobs' })).toBeVisible();

    // Verify seeded jobs and tier-1 companies render (e.g. OpenAI, Google, Amazon)
    await expect(page.getByText(/OpenAI|Google|Amazon|Meta|Netflix|Stripe/i).first()).toBeVisible();

    // Verify match percentage badge and experience levels
    await expect(page.getByText(/match/i).first()).toBeVisible();
    await expect(page.getByText(/Senior|Mid-Level|Entry-Level/i).first()).toBeVisible();

    // Test Experience Level Filter
    await page.getByRole('button', { name: 'Senior', exact: true }).click();
    await expect(page.getByText(/Senior/i).first()).toBeVisible();
  });
});
