import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 1 — Student-First Dashboard & Career Readiness', () => {
  test('should load Dashboard with student metrics, journey stepper, and next actions', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');

    // Branding & Header
    await expect(page.getByText('SkillOS').first()).toBeVisible();
    await expect(page.getByText('AI Career Copilot').first()).toBeVisible();

    // Student personalized greeting (Aditya Singh)
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)|Welcome back|Aditya/i })).toBeVisible();

    // Core Student Metrics
    await expect(page.getByText('Career Match', { exact: true })).toBeVisible();
    await expect(page.getByText('Job Readiness', { exact: true })).toBeVisible();
    await expect(page.getByText('Verified Skills', { exact: true })).toBeVisible();

    // Visual Career Journey & Next Best Actions
    await expect(page.getByText(/Your Career Journey|Your Personal Career Journey/i).first()).toBeVisible();
    await expect(page.getByText(/Your Next Best Actions|Next Best Actions/i).first()).toBeVisible();
  });
});
