import { test, expect } from '@playwright/test';

test.describe('E2E Test 7 — Projects & Skill Inference', () => {
  test('should display projects with tech stacks and expand Query H skill inference', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Projects
    await page.getByRole('link', { name: /projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
    await page.waitForLoadState('networkidle');

    // Verify Projects header
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    // Verify seeded project cards render
    await expect(page.getByText('AI Skin Disease Detection')).toBeVisible();

    // Click to expand AI Skin Disease Detection for skill inference (Query H)
    const projCard = page.locator('div:has-text("AI Skin Disease Detection")').first();
    await projCard.click();

    // Verify Skill Analysis section (Query H) appears
    await expect(page.getByText(/Skill Analysis — Query H/i)).toBeVisible();
    await expect(page.getByText('Direct Skills Demonstrated')).toBeVisible();

    // Verify direct skills badges (e.g. PyTorch / Python / Deep Learning)
    await expect(page.getByText('PyTorch', { exact: true }).first()).toBeVisible();

    // Verify inferred skills section is present
    await expect(page.getByText(/Inferred from Technologies/i)).toBeVisible();
  });
});
