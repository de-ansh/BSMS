import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Facility & Amenity Booking Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;
  const amenityName = `Clubhouse ${Date.now()}`;
  
  // Future dates to ensure "start time in future" check passes
  const startTime = '2026-07-20T14:00';
  const endTime = '2026-07-20T16:00';
  const overlapStartTime = '2026-07-20T15:00';
  const overlapEndTime = '2026-07-20T15:30';

  test.beforeAll(async ({ request }) => {
    // Seed building, admin, unit, and resident
    seededData = await createAdminUnitAndMember(request);
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('HTTP ERROR:', response.status(), response.url());
      }
    });
  });

  test('should support creating amenities, slot booking, overlap protection, and admin approvals', async ({ page }) => {
    // === PHASE 1: Admin creates the Amenity ===
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();

    // Go to Amenities via Sidebar
    await page.locator('aside button:has-text("Amenities")').click();

    // Click Add Amenity
    await page.getByRole('button', { name: 'Add Amenity' }).click();

    // Fill form
    await page.fill('input[id="name"]', amenityName);
    await page.fill('textarea[id="description"]', 'Community clubhouse with kitchen.');
    await page.fill('input[id="rules"]', 'Reservation required. Max 2 hours.');

    // Save
    await page.getByRole('button', { name: 'Create Facility' }).click();

    // Verify card is on screen
    await expect(page.locator(`text=${amenityName}`)).toBeVisible();

    // Logout Admin
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // === PHASE 2: Resident requests booking slot ===
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);
    await expect(page.locator(`text=${seededData.member.email}`)).toBeVisible();

    // Go to Amenities via Sidebar
    await page.locator('aside button:has-text("Amenities")').click();

    // Verify Clubhouse card displays
    await expect(page.locator(`text=${amenityName}`)).toBeVisible();

    // Click Book Slot
    await page.getByRole('button', { name: 'Book Slot' }).click();

    // Fill booking times
    await page.fill('input[id="start_time"]', startTime);
    await page.fill('input[id="end_time"]', endTime);

    // Request
    await page.getByRole('button', { name: 'Request Booking' }).click();

    // Switch to My Bookings tab
    await page.locator('#tab-bookings').click();

    // Verify booking shows as Pending
    await expect(page.locator('text=Pending').first()).toBeVisible();

    // === PHASE 3: Overlap Protection Check ===
    // Switch back to Amenities tab
    await page.locator('#tab-amenities').click();

    // Try to book overlapping slot
    await page.getByRole('button', { name: 'Book Slot' }).click();
    await page.fill('input[id="start_time"]', overlapStartTime);
    await page.fill('input[id="end_time"]', overlapEndTime);
    await page.getByRole('button', { name: 'Request Booking' }).click();

    // Verify error is shown in modal
    await expect(page.locator('text=overlaps with an existing booking')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // Logout Resident
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // === PHASE 4: Admin Approves the booking ===
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();

    // Go to Amenities via Sidebar
    await page.locator('aside button:has-text("Amenities")').click();

    // Switch to Approvals & History tab
    await page.locator('#tab-bookings').click();

    // Click Approve
    await page.getByRole('button', { name: 'Approve' }).first().click();

    // Verify status changes to Approved
    await expect(page.locator('text=Approved').first()).toBeVisible();
  });
});
