import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 7 — Projects & Skill Inference', () => {
  test('should display projects with tech stacks and expand Query H skill inference', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Verify Projects header
    await expect(page.getByRole('heading', { name: /My Projects/i })).toBeVisible();

    // Verify seeded project cards render
    await expect(page.getByText('AI Skin Disease Detection')).toBeVisible();

    // Click to expand Inspect Skill Inference (Query H)
    const inferenceBtn = page.getByRole('button', { name: /Inspect Skill Inference/i }).first();
    await inferenceBtn.click();

    // Verify Inferred Skills section (Query H) appears
    await expect(page.getByText(/Inferred Skills/i).first()).toBeVisible();
    await expect(page.getByText(/Query H/i).first()).toBeVisible();
  });
});
