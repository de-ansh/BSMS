import { test, expect } from '@playwright/test';

test.describe('Super Admin Workflows', () => {
  const baseURL = 'http://localhost:5173';
  const testBuildingName = `E2E Bldg ${Date.now()}`;
  const testAdminEmail = `admin_${Date.now()}@test.com`;

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', 'superadmin@bsms.com');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.getByText('Platform', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/super-admin/);
  });

  test('should create a building and assign an admin to it', async ({ page }) => {
    // 1. Click Add Building button
    await page.getByRole('button', { name: 'Add Building' }).click();

    // 2. Fill details
    await page.fill('input[id="name"]', testBuildingName);
    await page.fill('input[id="code"]', `code-${Date.now()}`);

    // 3. Submit
    await page.getByRole('button', { name: 'Create Building' }).click();

    // 4. Verify we navigated directly to building detail page
    await expect(page).toHaveURL(/.*\/super-admin\/buildings\/.*/);
    await expect(page.locator('h1')).toContainText(testBuildingName);

    // 5. Click Add Admin button
    await page.getByRole('button', { name: 'Add Admin' }).click();

    // 8. Fill Admin Details
    await page.locator('form input').nth(0).fill('Test Admin');
    await page.locator('form input').nth(1).fill(testAdminEmail);
    await page.locator('form input').nth(2).fill('admin123');

    // 9. Submit Admin form
    await page.getByRole('button', { name: 'Create Admin' }).click();

    // 10. Verify admin is added
    await expect(page.locator(`text=${testAdminEmail}`)).toBeVisible();
  });
});
