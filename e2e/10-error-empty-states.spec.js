import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 10 — Error & Empty States Handling', () => {
  test('should handle skill-less student (student-20) gracefully without crashing', async ({ page }) => {
    await loginAs(page, 'Mohan Das');

    // Verify student name is rendered in heading
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)|Welcome back|Mohan/i })).toBeVisible();

    // Navigate to Skills with student-20
    await page.getByRole('link', { name: /My Skills/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/No skills in portfolio|Add your first|No verified skills/i).first()).toBeVisible();

    // Navigate to Jobs with student-20
    await page.getByRole('link', { name: /Job Matches/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/No matching job openings|Add more verified skills|No jobs/i).first()).toBeVisible();
  });

  test('should handle invalid career route with a clean error state', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/career/invalid-nonexistent-career-id-9999');
    await page.waitForLoadState('domcontentloaded');

    // Verify clean ErrorState component renders with error message
    await expect(page.getByText(/not found|Something went wrong|Career role not found/i).first()).toBeVisible();
  });
});
