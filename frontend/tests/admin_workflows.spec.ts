import { test, expect } from '@playwright/test';
import { createAdminAndGetCredentials } from './helpers';

test.describe('Admin Core Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let adminCredentials: { email: string; password: string };
  const testUnitNumber = `U-${Math.floor(Math.random() * 10000)}`;
  const testMemberName = `Resident ${Date.now()}`;
  const testStaffName = `Guard ${Date.now()}`;
  const testNoticeTitle = `Notice ${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    // 1. Programmatically seed building and admin
    adminCredentials = await createAdminAndGetCredentials(request);
  });

  test.beforeEach(async ({ page }) => {
    // Debug logging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('HTTP ERROR:', response.status(), response.url());
      }
    });

    // 2. Login as the seeded Admin before each test
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should create unit and member', async ({ page }) => {
    // Navigate to Units & Members
    await page.goto(baseURL + '/members');

    // Create Unit
    await page.getByRole('button', { name: 'Add Unit' }).first().click();
    await page.fill('input[id="unitNumber"]', testUnitNumber);
    await page.fill('input[id="floor"]', '1');
    await page.fill('input[id="bedrooms"]', '2');
    await page.fill('input[id="bathrooms"]', '2');
    await page.fill('input[id="fee"]', '150');
    await page.getByRole('button', { name: 'Create Unit' }).click();

    // Verify redirected to unit detail page
    await expect(page).toHaveURL(/.*\/units\/.*/);
    await expect(page.locator('h1')).toContainText(testUnitNumber);

    // Navigate back to members page to create member
    await page.goto(baseURL + '/members');

    // Switch view to Members
    await page.getByRole('button', { name: 'Members', exact: true }).click();

    // Create Member
    await page.getByRole('button', { name: 'Add Member' }).first().click();
    await page.fill('input[id="name"]', testMemberName);
    await page.fill('input[id="email"]', `${Date.now()}@res.com`);
    await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'resident123');
    // Open select dropdown for Unit
    await page.getByRole('button', { name: 'Select unit' }).click();
    // Choose our unit from list
    await page.getByText(testUnitNumber, { exact: false }).click();
    await page.getByRole('button', { name: 'Create Member' }).click();

    // Verify member exists in the members list
    await expect(page.locator(`text=${testMemberName}`)).toBeVisible();
  });

  test('should create a staff member', async ({ page }) => {
    // Navigate to Staff
    await page.goto(baseURL + '/staff');

    // Create Staff
    await page.getByRole('button', { name: 'Add Staff' }).click();
    await page.fill('input[id="name"]', testStaffName);
    await page.fill('input[id="email"]', `staff_${Date.now()}@test.com`);
    await page.fill('input[id="phone"]', '9876543210');
    await page.fill('input[id="position"]', 'Security Guard');
    await page.fill('input[id="department"]', 'Security');
    await page.getByRole('button', { name: 'Create Staff' }).click();

    // Verify redirected to profile
    await expect(page).toHaveURL(/.*\/staff\/.*/);
    await expect(page.locator('h1')).toContainText(testStaffName);
  });

  test('should broadcast a new notice', async ({ page }) => {
    // Navigate to Notices
    await page.goto(baseURL + '/notices');

    // Click New Notice button
    await page.getByRole('button', { name: 'New Notice' }).click();
    
    // Fill Notice Form
    await page.fill('input[placeholder="Notice title"]', testNoticeTitle);
    await page.fill('textarea[placeholder="Write the notice content..."]', 'This is a test notice broadcasted by admin.');
    
    // Publish
    await page.getByRole('button', { name: 'Publish' }).click();

    // Verify notice appears in list
    await expect(page.locator(`text=${testNoticeTitle}`)).toBeVisible();
  });
});
