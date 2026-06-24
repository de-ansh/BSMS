import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Visitor Management Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;
  const visitorName = `Guest ${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    // Seed building, admin, unit, and resident (member)
    seededData = await createAdminUnitAndMember(request);
  });

  test('should pre-approve a visitor as a resident, then check-in and check-out as an admin', async ({ page }) => {
    // 1. Login as Resident
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    
    // Resident is redirected to /notices
    await expect(page).toHaveURL(/.*\/notices/);
    await expect(page.locator(`text=${seededData.member.email}`)).toBeVisible();

    // 2. Navigate to Visitors
    await page.goto(baseURL + '/visitors');

    // 3. Click Pre-Approve
    await page.getByRole('button', { name: 'Pre-Approve' }).click();
    await expect(page).toHaveURL(/.*\/visitors\/new/);

    // 4. Fill form
    await page.fill('input[id="visitor_name"]', visitorName);
    await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="purpose"]', 'Family Visit');
    const today = new Date().toISOString().slice(0, 10);
    await page.fill('input[id="expected_arrival"]', today);

    // 5. Save
    await page.getByRole('button', { name: 'Save Visitor' }).click();
    await expect(page).toHaveURL(/.*\/visitors/);

    // 6. Verify visitor list contains the new guest
    const visitorCard = page.locator(`text=${visitorName}`);
    await expect(visitorCard).toBeVisible();

    // Verify status is Pre-Approved
    await expect(page.locator('text=Pre-Approved').first()).toBeVisible();

    // Ensure status buttons (Check In, Deny, etc.) are NOT visible to the resident
    await expect(page.locator('text=Check In')).not.toBeVisible();
    await expect(page.locator('text=Deny')).not.toBeVisible();

    // 7. Logout by clicking logout button
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);
    
    // 8. Login as Admin
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();

    // 9. Navigate to Visitors
    await page.goto(baseURL + '/visitors');

    // 10. Find visitor and verify status
    await expect(page.locator(`text=${visitorName}`)).toBeVisible();
    await expect(page.locator('text=Pre-Approved').first()).toBeVisible();

    // 11. Click Check In
    await page.getByRole('button', { name: 'Check In' }).first().click();

    // Verify status changes to Checked In
    await expect(page.locator('text=Checked In').first()).toBeVisible();

    // 12. Click Check Out
    await page.getByRole('button', { name: 'Check Out' }).first().click();

    // Verify status changes to Checked Out
    await expect(page.locator('text=Checked Out').first()).toBeVisible();
  });
});
