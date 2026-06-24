import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Vehicle and Parking Space Management Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;
  const plateNumber = `PLT-${Math.floor(Math.random() * 100000)}`;

  test.beforeAll(async ({ request }) => {
    // Seed building, admin, unit, and resident member
    seededData = await createAdminUnitAndMember(request);
  });

  test('should create, allocate parking slot as admin, then register and view vehicle as resident', async ({ page }) => {
    // 1. Login as Admin
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Parking
    await page.goto(baseURL + '/parking');
    await expect(page.locator('text=Vehicles & Parking')).toBeVisible();

    // 3. Click "Parking Grid" tab
    await page.getByRole('button', { name: 'Parking Grid' }).click();

    // 4. Click "Create Space" to add a new slot
    await page.getByRole('button', { name: 'Create Space' }).click();
    await page.fill('input[id="slotNum"]', 'P-E2E-1');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Verify P-E2E-1 slot is created and visible
    await expect(page.locator('text=P-E2E-1')).toBeVisible();

    // 5. Assign slot to Unit
    await page.getByRole('button', { name: 'Assign' }).first().click();
    // Select unit from dropdown
    await page.locator('label:has-text("Assign to Unit") + div button').first().click();
    await page.getByText(`Unit ${seededData.unit.unitNumber}`, { exact: false }).first().click();
    await page.getByRole('button', { name: 'Save Assignment' }).click();

    // Verify slot is now allocated to unit
    await expect(page.locator(`text=Unit ${seededData.unit.unitNumber}`).first()).toBeVisible();

    // 6. Logout Admin
    await page.evaluate(() => localStorage.removeItem('bsms_token'));

    // 7. Login as Resident
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);

    // 8. Go to Parking page
    await page.goto(baseURL + '/parking');

    // 9. Click "Parking Grid" tab
    await page.getByRole('button', { name: 'Parking Grid' }).click();
    
    // Verify Resident sees the allocated slot
    await expect(page.locator('text=P-E2E-1')).toBeVisible();
    await expect(page.locator(`text=Unit ${seededData.unit.unitNumber}`).first()).toBeVisible();
    // Ensure "Assign" button is NOT visible for resident
    await expect(page.locator('button:has-text("Assign")')).not.toBeVisible();

    // 10. Register Vehicle
    await page.getByRole('button', { name: 'Register Vehicle' }).click();
    await page.fill('input[id="plate"]', plateNumber);
    await page.fill('input[id="makeModel"]', 'Tesla Model 3');
    await page.fill('input[id="color"]', 'Blue');
    await page.getByRole('button', { name: 'Register', exact: true }).click();

    // Go back to Vehicles tab if not active
    await page.getByRole('button', { name: 'Vehicles', exact: true }).click();

    // Verify vehicle plate is listed
    await expect(page.locator(`text=${plateNumber}`)).toBeVisible();

    // 11. Logout Resident
    await page.evaluate(() => localStorage.removeItem('bsms_token'));

    // 12. Login as Admin again to verify the Vehicles Ledger
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Go to Parking Ledger
    await page.goto(baseURL + '/parking');
    
    // Verify the resident's registered vehicle shows up in Admin's Ledger
    await expect(page.locator(`text=${plateNumber}`)).toBeVisible();
    await expect(page.locator(`text=${seededData.member.name}`)).toBeVisible();
    await expect(page.locator(`text=${seededData.unit.unitNumber}`)).toBeVisible();
  });
});
