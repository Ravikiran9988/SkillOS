import { test, expect } from '@playwright/test';

test.describe('E2E Test 9 — Complete Navigation Flow', () => {
  test('should seamlessly transition through all pages without broken routes or blank screens', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('SkillOS')).toBeVisible();

    // 2. Dashboard -> Profile
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();

    // 3. Profile -> Careers
    await page.getByRole('link', { name: /careers/i }).click();
    await expect(page).toHaveURL(/\/career$/);
    await expect(page.getByRole('heading', { name: 'Career Explorer' })).toBeVisible();

    // 4. Careers -> Career Detail (click on AI Researcher heading in career card)
    await page.getByRole('heading', { name: 'AI Researcher' }).click();
    await expect(page).toHaveURL(/\/career\/cr-airesearcher/);
    await expect(page.getByRole('heading', { name: 'AI Researcher' })).toBeVisible();

    // 5. Career Detail -> Jobs
    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByRole('heading', { name: 'Job Opportunities' })).toBeVisible();

    // 6. Jobs -> Projects
    await page.getByRole('link', { name: /projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    // 7. Projects -> Graph Explorer
    await page.getByRole('link', { name: /graph explorer/i }).click();
    await expect(page).toHaveURL(/\/graph/);
    await expect(page.getByRole('heading', { name: 'Graph Explorer' })).toBeVisible();

    // 8. Graph Explorer -> Back to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
