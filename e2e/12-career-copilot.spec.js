import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 12 — AI Career Copilot Chat & Grounding', () => {
  test('should interact with AI Career Copilot and receive graph-grounded guidance', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/copilot');
    await page.waitForLoadState('networkidle');

    // Verify Copilot header
    await expect(page.getByRole('heading', { name: /AI Career Copilot/i })).toBeVisible();

    // Verify initial prompt suggestion exists: "What should I learn next?"
    const promptBtn = page.getByRole('button', { name: /What should I learn next/i });
    await expect(promptBtn).toBeVisible();
    await promptBtn.click();

    // Wait for response message to appear
    await expect(page.locator('main').getByText(/CognoDB|skills|learning|roadmap/i).first()).toBeVisible({ timeout: 15000 });

    // Verify action links rendered in copilot response
    await expect(page.getByRole('button', { name: /View Skill Gap|Open Roadmap|Find Jobs/i }).first()).toBeVisible();
  });
});
