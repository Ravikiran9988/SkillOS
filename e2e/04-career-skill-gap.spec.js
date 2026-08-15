import { test, expect } from '@playwright/test';

test.describe('E2E Test 4 — Career Skill Gap Analysis', () => {
  test('should display accurate skill match %, matched skills, missing skills, and importance weights', async ({ page }) => {
    await page.goto('/career/cr-airesearcher');
    await page.waitForLoadState('networkidle');

    // Wait for student dropdown and select student-5
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Verify Career title & description
    await expect(page.getByRole('heading', { name: 'AI Researcher' })).toBeVisible();
    await expect(page.getByText(/Conducts research in deep learning/i)).toBeVisible();

    // Verify live computed match % (57% for Aditya Singh in live database)
    await expect(page.getByText(/57%/).first()).toBeVisible();
    await expect(page.getByText('skill match')).toBeVisible();

    // Verify Required Skills section
    await expect(page.getByRole('heading', { name: 'Required Skills' })).toBeVisible();
    await expect(page.getByText('Python', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('PyTorch', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Deep Learning', { exact: true }).first()).toBeVisible();

    // Verify Skill Gap section (missing skills)
    await expect(page.getByRole('heading', { name: 'Skill Gap' })).toBeVisible();
    await expect(page.getByText(/skills to acquire for AI Researcher/i)).toBeVisible();

    // Verify importance indicators
    await expect(page.getByText(/critical/i).first()).toBeVisible();
  });
});
