import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 9 — Complete Navigation Flow Across Pages', () => {
  test('should seamlessly transition through all pages without broken routes or blank screens', async ({ page }) => {
    // 1. Dashboard
    await loginAs(page, 'Aditya Singh');
    await expect(page.getByText('SkillOS').first()).toBeVisible();

    // 2. Dashboard -> Profile
    await page.getByRole('link', { name: /My Profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('main').getByText('Aditya Singh').first()).toBeVisible();

    // 3. Profile -> Skills
    await page.getByRole('link', { name: /My Skills/i }).click();
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByRole('heading', { name: /Skills/i }).first()).toBeVisible();

    // 4. Skills -> Projects
    await page.getByRole('link', { name: /My Projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: /Projects/i }).first()).toBeVisible();

    // 5. Projects -> Career Explorer
    await page.getByRole('link', { name: /Career Explorer/i }).click();
    await expect(page).toHaveURL(/\/careers/);
    await expect(page.getByRole('heading', { name: /Career Explorer/i }).first()).toBeVisible();

    // 6. Career Explorer -> Skill Gap
    await page.getByRole('link', { name: /Skill Gap/i }).click();
    await expect(page).toHaveURL(/\/skill-gap/);
    await expect(page.getByRole('heading', { name: /Skill Gap/i }).first()).toBeVisible();

    // 7. Skill Gap -> Learning Roadmap
    await page.getByRole('link', { name: /Roadmap/i }).click();
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.getByRole('heading', { name: /Roadmap/i }).first()).toBeVisible();

    // 8. Roadmap -> Job Matches
    await page.getByRole('link', { name: /Job Matches/i }).click();
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByRole('heading', { name: /Jobs/i }).first()).toBeVisible();

    // 9. Jobs -> AI Career Copilot
    await page.getByRole('link', { name: /AI Copilot|Career Copilot/i }).click();
    await expect(page).toHaveURL(/\/copilot/);
    await expect(page.getByRole('heading', { name: /Career Copilot|Copilot/i }).first()).toBeVisible();

    // 10. Copilot -> Career Graph
    await page.getByRole('link', { name: /Career Graph/i }).click();
    await expect(page).toHaveURL(/\/graph/);
    await expect(page.getByRole('heading', { name: /Career Graph/i }).first()).toBeVisible();

    // Back to Home
    await page.getByRole('link', { name: /Home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
