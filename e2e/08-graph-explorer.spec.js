import { test, expect } from '@playwright/test';

test.describe('E2E Test 8 — My Career Graph Explorer', () => {
  test('should render interactive React Flow graph with student nodes and relationship edges', async ({ page }) => {
    await page.goto('/graph');
    await page.waitForLoadState('networkidle');

    // Verify Graph Explorer title
    await expect(page.getByRole('heading', { name: /My Career Graph/i })).toBeVisible();

    // Verify Legend items
    await expect(page.getByText('You (Student)', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Skill', { exact: false }).first()).toBeVisible();

    // Verify React Flow canvas is rendered
    const reactFlowCanvas = page.locator('.react-flow');
    await expect(reactFlowCanvas).toBeVisible();

    // Verify graph nodes are rendered
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible();
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(3);

    // Verify Student node label (Aditya Singh)
    await expect(page.locator('.react-flow__node:has-text("Aditya Singh")')).toBeVisible();
  });
});
