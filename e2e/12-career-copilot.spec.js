import { test, expect } from '@playwright/test';

test.describe('E2E Test 12 — AI Career Copilot Chat & Grounding', () => {
  test('should interact with AI Career Copilot and receive graph-grounded guidance', async ({ page }) => {
    await page.goto('/copilot');
    await page.waitForLoadState('networkidle');

    // Verify Copilot header
    await expect(page.getByRole('heading', { name: /AI Career Copilot/i })).toBeVisible();
    await expect(page.getByText('CognoDB Connected')).toBeVisible();

    // Verify initial welcome message exists
    await expect(page.getByText(/I have loaded your personal CognoDB career graph/i)).toBeVisible();

    // Click suggested prompt chip: "What should I learn next?"
    const promptBtn = page.getByRole('button', { name: /What should I learn next/i });
    await expect(promptBtn).toBeVisible();
    await promptBtn.click();

    // Wait for response to appear
    await expect(page.getByText(/Based on your CognoDB career graph/i)).toBeVisible({ timeout: 15000 });

    // Verify action links rendered in copilot response
    await expect(page.getByRole('button', { name: /View Roadmap|View Skill Gaps|Explore Job Matches/i }).first()).toBeVisible();
  });
});
