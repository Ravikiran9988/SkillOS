import { test, expect } from '@playwright/test';

test.describe('E2E Test 9 — Complete Navigation Flow Across 10 Pages', () => {
  test('should seamlessly transition through all 10 pages without broken routes or blank screens', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('SkillOS').first()).toBeVisible();

    // 2. Dashboard -> Profile
    await page.getByRole('link', { name: /My Profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: /My Profile/i })).toBeVisible();

    // 3. Profile -> Skills
    await page.getByRole('link', { name: /My Skills/i }).click();
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByRole('heading', { name: /My Skills Portfolio/i })).toBeVisible();

    // 4. Skills -> Projects
    await page.getByRole('link', { name: /My Projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: /My Projects & Skill Inference/i })).toBeVisible();

    // 5. Projects -> Career Explorer
    await page.getByRole('link', { name: /Career Explorer/i }).click();
    await expect(page).toHaveURL(/\/careers/);
    await expect(page.getByRole('heading', { name: /Find Your Best Career Path/i })).toBeVisible();

    // 6. Career Explorer -> Skill Gap
    await page.getByRole('link', { name: /Skill Gap/i }).click();
    await expect(page).toHaveURL(/\/skill-gap/);
    await expect(page.getByRole('heading', { name: /What's Between You/i })).toBeVisible();

    // 7. Skill Gap -> Learning Roadmap
    await page.getByRole('link', { name: /Learning Roadmap/i }).click();
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.getByRole('heading', { name: /Personalized Learning Roadmap/i })).toBeVisible();

    // 8. Roadmap -> Job Matches
    await page.getByRole('link', { name: /Job Matches/i }).click();
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByRole('heading', { name: /Jobs That Fit You/i })).toBeVisible();

    // 9. Jobs -> AI Career Copilot
    await page.getByRole('link', { name: /AI Career Copilot/i }).click();
    await expect(page).toHaveURL(/\/copilot/);
    await expect(page.getByRole('heading', { name: /AI Career Copilot/i })).toBeVisible();

    // 10. Copilot -> My Career Graph
    await page.getByRole('link', { name: /My Career Graph/i }).click();
    await expect(page).toHaveURL(/\/graph/);
    await expect(page.getByRole('heading', { name: /My Career Graph/i })).toBeVisible();

    // Back to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
