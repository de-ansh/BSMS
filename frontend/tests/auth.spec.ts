import { test, expect } from '@playwright/test';

test.describe('Authentication Workflows', () => {
  const baseURL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL + '/login');
  });

  test('should login successfully as super admin', async ({ page }) => {
    // Fill the email and password
    await page.fill('input[type="email"]', 'superadmin@bsms.com');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'login-page.png' });
    
    // Select the Platform tab (Super Admin)
    await page.getByText('Platform', { exact: true }).click();
    
    // Click login button
    await page.getByText('INITIATE SESSION').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/super-admin/);
    await expect(page.locator('h1')).toContainText('Buildings');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@bsms.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.getByText('Platform', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
