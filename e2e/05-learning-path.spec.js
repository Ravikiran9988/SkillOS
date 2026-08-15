import { test, expect } from '@playwright/test';

test.describe('E2E Test 5 — Prerequisite Learning Path', () => {
  test('should render graph-derived prerequisite chain with ordered steps and course links', async ({ page }) => {
    await page.goto('/career/cr-airesearcher');
    await page.waitForLoadState('networkidle');

    // Ensure student-5 is selected
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Verify Prerequisite Learning Path card
    await expect(page.getByRole('heading', { name: /Prerequisite Learning Path/i })).toBeVisible();
    await expect(page.getByText('Graph-traversed prerequisite chain — skills ordered by dependency.')).toBeVisible();

    // Verify numbered step indicators (1, 2, 3, etc.)
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();

    // Verify courses linked to learning steps
    const courseLabels = page.locator('text=·');
    await expect(courseLabels.first()).toBeVisible();

    // Verify no error boundary or crash
    await expect(page.locator('.error-state')).not.toBeVisible();
  });
});
