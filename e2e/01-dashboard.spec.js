import { test, expect } from '@playwright/test';

test.describe('E2E Test 1 — Dashboard & Student Selection', () => {
  test('should load Dashboard, display branding, stats, and support student selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Branding & Header
    await expect(page.getByText('SkillOS', { exact: true })).toBeVisible();
    await expect(page.getByText('Career Intelligence', { exact: true })).toBeVisible();

    // Select student-5 (Aditya Singh)
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Verify selected student welcome & header
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.locator('h1').getByText('Aditya Singh')).toBeVisible();
    await expect(page.locator('header').getByText('Aditya Singh')).toBeVisible();

    // Verify statistics cards
    await expect(page.getByText('Skills', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Career Matches' })).toBeVisible();
    await expect(page.getByText('Top Match', { exact: true })).toBeVisible();

    // Verify AI Researcher career match is displayed
    await expect(page.locator('main').getByText('AI Researcher').first()).toBeVisible();
  });
});
