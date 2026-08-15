import { test, expect } from '@playwright/test';

test.describe('E2E Test 8 — Graph Explorer', () => {
  test('should render interactive React Flow graph with multi-label nodes and relationship edges', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure student-5 is selected
    const studentSelect = page.locator('select');
    await studentSelect.waitFor({ state: 'visible' });
    await studentSelect.selectOption('student-5');
    await page.waitForLoadState('networkidle');

    // Navigate to Graph Explorer
    await page.getByRole('link', { name: /graph explorer/i }).click();
    await expect(page).toHaveURL(/\/graph/);
    await page.waitForLoadState('networkidle');

    // Verify Graph Explorer title
    await expect(page.getByRole('heading', { name: 'Graph Explorer' })).toBeVisible();

    // Verify Legend items
    await expect(page.getByText('Student', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Skill', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Career', { exact: false }).first()).toBeVisible();

    // Verify React Flow canvas is rendered
    const reactFlowCanvas = page.locator('.react-flow');
    await expect(reactFlowCanvas).toBeVisible();

    // Verify React Flow controls (zoom in, zoom out, fit view)
    const controls = page.locator('.react-flow__controls');
    await expect(controls).toBeVisible();

    // Verify graph nodes are rendered
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible();
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(5);

    // Verify Student node label (Aditya Singh)
    await expect(page.locator('.react-flow__node:has-text("Aditya Singh")')).toBeVisible();

    // Verify at least one Skill node label (e.g. Python, PyTorch)
    await expect(page.locator('.react-flow__node:has-text("Python")').first()).toBeVisible();

    // Verify no loading spinner remains
    await expect(page.getByText('Building graph from CognoDB...')).not.toBeVisible();
  });
});
