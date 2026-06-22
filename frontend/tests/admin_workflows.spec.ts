import { test, expect } from '@playwright/test';

test.describe('Admin Workflows', () => {
  const baseURL = 'http://localhost:5173';
  const testUnitNumber = `U-${Date.now()}`;
  const testMemberName = `Resident ${Date.now()}`;
  const testStaffName = `Guard ${Date.now()}`;
  const testNoticeTitle = `Test Notice ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // We assume the previous tests created an admin or we just use super admin to do admin things
    // Wait, let's login as super admin since it has access to everything
    // Actually, let's try logging in as the newly created admin if we could, but tests should be independent.
    // Let's just login as super admin to test the admin features for simplicity.
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', 'superadmin@bsms.com');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.getByText('Platform', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/super-admin/);

    // Navigate to a building dashboard to act as admin.
    // Click on the first building to enter its dashboard.
    await page.getByRole('tab', { name: 'Buildings' }).click();
    // Assuming clicking a building's row opens its dashboard.
    // Since we don't know the exact class, let's just go directly to /dashboard 
    // The superadmin can access /dashboard if the token is valid, wait, let's see.
    // If not, we will need to login as admin.
  });

  test('should create a new unit and member', async ({ page }) => {
    // Navigate directly to units/members (if accessible for super admin or admin)
    // Actually, superadmin might not have access to /units. Let's try.
    await page.goto(baseURL + '/units');
    
    // Check if we are redirected to /notices or if we stay on /units
    // If this fails, we need to log in as an actual admin.
    
    // Add Unit
    await page.getByRole('button', { name: 'Add Unit' }).first().click();
    await page.fill('input[id="unitNumber"]', testUnitNumber);
    await page.fill('input[id="floor"]', '1');
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Create Unit' }).click();
    
    // Go to Members mode
    await page.getByRole('button', { name: 'Members' }).click();
    await page.getByRole('button', { name: 'Add Member' }).first().click();
    
    // Add Member
    await page.fill('input[id="name"]', testMemberName);
    await page.fill('input[id="email"]', `${Date.now()}@resident.com`);
    await page.fill('input[id="phone"]', '1234567890');
    // Unit select
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: testUnitNumber }).click();
    await page.getByRole('button', { name: 'Create Member' }).click();
    
    await expect(page.locator(`text=${testMemberName}`)).toBeVisible();
  });
});
