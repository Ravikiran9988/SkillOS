import { test, expect } from '@playwright/test';

test.describe('E2E Test 1 — Student-First Dashboard & Career Readiness', () => {
  test('should load Dashboard with student metrics, journey stepper, and next actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Branding & Header
    await expect(page.getByText('SkillOS').first()).toBeVisible();
    await expect(page.getByText('AI Career Copilot').first()).toBeVisible();

    // Student personalized greeting (Aditya Singh)
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Aditya Singh/i })).toBeVisible();

    // 4 Core Student Metrics
    await expect(page.getByText('Target Goal', { exact: true })).toBeVisible();
    await expect(page.getByText('Career Match', { exact: true })).toBeVisible();
    await expect(page.getByText('Job Readiness', { exact: true })).toBeVisible();
    await expect(page.getByText('My Skills', { exact: true })).toBeVisible();

    // Visual Career Journey & Next Best Actions
    await expect(page.getByText('Your Personal Career Journey', { exact: true })).toBeVisible();
    await expect(page.getByText('Your Next Best Actions', { exact: true })).toBeVisible();
  });
});
