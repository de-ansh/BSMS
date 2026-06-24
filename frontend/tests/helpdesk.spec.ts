import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Helpdesk & Complaint Management Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;
  let staffData: any;
  const staffName = `Plumber Bob ${Date.now()}`;
  const ticketTitle = `Leak ${Date.now()}`;
  const residentComment = "This is causing a puddle, please send someone urgently!";
  const adminComment = "Dispatched Plumber Bob, he should arrive shortly.";

  test.beforeAll(async ({ request }) => {
    // 1. Seed building, admin, unit, and resident
    seededData = await createAdminUnitAndMember(request);

    // 2. Login as Admin to get token and seed a Staff member
    const adminLoginRes = await request.post('http://localhost:8000/auth/login', {
      data: {
        email: seededData.admin.email,
        password: seededData.admin.password,
        role: 'admin'
      }
    });
    expect(adminLoginRes.ok()).toBeTruthy();
    const { access_token: adminToken } = await adminLoginRes.json();

    // 3. Create a staff member via API
    const staffRes = await request.post('http://localhost:8000/staff/', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      data: {
        name: staffName,
        email: `bob-${Date.now()}@test.com`,
        phone: '1234567890',
        position: 'Plumber',
        department: 'Maintenance',
        join_date: new Date().toISOString().slice(0, 10)
      }
    });
    expect(staffRes.ok()).toBeTruthy();
    staffData = await staffRes.json();
  });

  test('should allow resident to raise a complaint, comment, and admin to assign staff, update status and comment', async ({ page }) => {
    // === PHASE 1: Resident submits ticket and comments ===
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);
    await expect(page.locator(`text=${seededData.member.email}`)).toBeVisible();

    // Go to Helpdesk
    await page.goto(baseURL + '/helpdesk');

    // Click New Ticket
    await page.getByRole('button', { name: 'New Ticket' }).click();
    await expect(page).toHaveURL(/.*\/helpdesk\/new/);

    // Fill form
    await page.getByRole('button', { name: 'Select category' }).click();
    await page.getByText('Plumbing', { exact: true }).click();
    await page.fill('input[id="title"]', ticketTitle);
    await page.fill('textarea[id="description"]', "Water leaking from kitchen sink faucet.");

    // Submit
    await page.getByRole('button', { name: 'Submit Ticket' }).click();
    await expect(page).toHaveURL(/.*\/helpdesk/);

    // Verify card is visible on List Dashboard
    const ticketCard = page.locator(`text=${ticketTitle}`);
    await expect(ticketCard).toBeVisible();
    await expect(page.locator('text=Pending').first()).toBeVisible();

    // View Details
    await page.getByRole('button', { name: 'View Ticket Details' }).first().click();
    await expect(page).toHaveURL(/.*\/helpdesk\/.*/);

    // Submit comment
    await page.fill('input[placeholder="Post a question, answer, or update..."]', residentComment);
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify comment is on page
    await expect(page.locator(`text=${residentComment}`)).toBeVisible();

    // Verify admin elements are not visible to resident
    await expect(page.locator('text=Manage Ticket')).not.toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // === PHASE 2: Admin reviews ticket, assigns staff, updates status, and comments ===
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();

    // Go to Helpdesk
    await page.goto(baseURL + '/helpdesk');

    // Verify ticket card exists and click details
    await expect(page.locator(`text=${ticketTitle}`)).toBeVisible();
    await page.getByRole('button', { name: 'View Ticket Details' }).first().click();

    // Verify resident comment exists
    await expect(page.locator(`text=${residentComment}`)).toBeVisible();

    // Update status to In Progress
    await page.locator('#status-trigger').click();
    await page.getByText('In Progress', { exact: true }).click();

    // Assign staff (Plumber Bob)
    await page.locator('#staff-trigger').click();
    await page.getByText(staffName, { exact: false }).click();

    // Save settings
    await page.getByRole('button', { name: 'Save Settings' }).click();

    // Verify status badge changed and staff card updated
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator(`text=${staffName}`)).toBeVisible();

    // Post an admin comment
    await page.fill('input[placeholder="Post a question, answer, or update..."]', adminComment);
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify admin comment appears
    await expect(page.locator(`text=${adminComment}`)).toBeVisible();

    // Resolve the ticket
    await page.locator('#status-trigger').click();
    await page.getByText('Resolved', { exact: true }).click();
    await page.getByRole('button', { name: 'Save Settings' }).click();

    // Verify status badge changed to Resolved
    await expect(page.locator('text=Resolved').first()).toBeVisible();
  });
});
