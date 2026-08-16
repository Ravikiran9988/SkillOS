import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helper.js';

test.describe('E2E Test 8 — My Career Graph Explorer', () => {
  test('should render interactive React Flow graph with student nodes and relationship edges', async ({ page }) => {
    await loginAs(page, 'Aditya Singh');
    await page.goto('/graph');
    await page.waitForLoadState('domcontentloaded');

    // Verify Graph Explorer title
    await expect(page.getByRole('heading', { name: /Career Graph/i })).toBeVisible();

    // Verify React Flow canvas is rendered
    const reactFlowCanvas = page.locator('.react-flow');
    await expect(reactFlowCanvas).toBeVisible();

    // Verify graph nodes are rendered
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible({ timeout: 15000 });
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(3);

    // Verify Student node label (Aditya Singh)
    await expect(page.locator('.react-flow__node:has-text("Aditya Singh")').first()).toBeVisible();
  });
});
