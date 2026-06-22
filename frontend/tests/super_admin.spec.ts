import { test, expect } from '@playwright/test';

test.describe('Super Admin Workflows', () => {
  const baseURL = 'http://localhost:5173';
  const testBuildingName = `Test Building ${Date.now()}`;
  const testAdminEmail = `admin_${Date.now()}@test.com`;

  test.beforeEach(async ({ page }) => {
    // Login as Super Admin before each test
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', 'superadmin@bsms.com');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.getByText('Platform', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/super-admin/);
  });

  test('should create a new building', async ({ page }) => {
    // Click on Add Building button
    await page.getByRole('button', { name: 'Add Building' }).click();

    // Fill building details
    await page.fill('input[id="name"]', testBuildingName);
    await page.fill('input[id="code"]', `test-${Date.now()}`);

    // Submit form
    await page.getByRole('button', { name: 'Create Building' }).click();

    // Should redirect back to buildings list
    await expect(page).toHaveURL(/.*\/super-admin/);
    
    // Verify building is in the list
    await expect(page.locator(`text=${testBuildingName}`)).toBeVisible();
  });

  test('should assign an admin to a building', async ({ page }) => {
    // Go to Admin Users tab
    await page.getByRole('tab', { name: 'Admin Users' }).click();

    // Click Add Admin button
    await page.getByRole('button', { name: 'Add Admin' }).click();

    // Fill admin details
    await page.fill('input[placeholder="e.g. John Doe"]', 'Test Admin');
    await page.fill('input[placeholder="e.g. john@skyline.com"]', testAdminEmail);
    await page.fill('input[placeholder="Set initial password"]', 'admin123');

    // Click the trigger for the building select dropdown
    // This is a bit tricky with shadcn select. We click the SelectTrigger
    await page.locator('button[role="combobox"]').click();
    
    // Playwright handles the select content popup. We just pick the first option if it's rendered, or we can use our testBuildingName
    // We'll click the building we just created (or any building if it's not parallel). Let's just click the first available building
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: 'Create Admin User' }).click();

    // Verify admin is in the list
    await expect(page.locator(`text=${testAdminEmail}`)).toBeVisible();
  });
});
