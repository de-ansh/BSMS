import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Billing & Payments Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;

  test.beforeAll(async ({ request }) => {
    // 1. Programmatically seed building, admin, unit, and member
    seededData = await createAdminUnitAndMember(request);
  });

  test.beforeEach(async ({ page }) => {
    // 2. Login as the seeded Admin before each test
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();
  });

  test('should create an invoice and record a payment', async ({ page }) => {
    // Navigate to Billing
    await page.getByRole('button', { name: 'Billing' }).click();

    // Click Create Invoice button
    await page.getByRole('button', { name: 'Create Invoice' }).first().click();
    await expect(page).toHaveURL(/.*\/billing\/new/);

    // Select Member from dropdown
    await page.getByRole('button', { name: 'Select member' }).click();
    await page.getByText(seededData.member.name, { exact: false }).click();

    // The unit and amount ($150) should be auto-selected based on member.
    // Fill Due Date
    const today = new Date().toISOString().slice(0, 10);
    await page.fill('input[id="dueDate"]', today);

    // Create Invoice
    await page.getByRole('button', { name: 'Create Invoice' }).click();

    // Verify redirect to invoice detail page
    await expect(page).toHaveURL(/.*\/billing\/.*/);
    
    // Amount should be $150.00
    await expect(page.locator('text=$150.00').first()).toBeVisible();

    // Fill payment form
    await page.fill('input[id="payAmount"]', '50.00');
    // Fill Date
    await page.fill('input[id="payDate"]', today);
    // Method trigger is Cash by default, we just click Record Payment
    await page.getByRole('button', { name: 'Record Payment' }).click();

    // Verify payment recorded in history and amount remaining is $100.00
    await expect(page.locator('text=$100.00')).toBeVisible();
    await expect(page.locator('text=$50.00')).toHaveCount(2); // One in payment history, one in Paid grid cell
  });

  test('should support bulk auto-generation and resident online payment', async ({ page }) => {
    // === PHASE 1: Admin bulk auto-generates invoices ===
    // Navigate to Billing
    await page.getByRole('button', { name: 'Billing' }).click();

    // Click Auto-Bill
    await page.getByRole('button', { name: 'Auto-Bill' }).click();

    // Fill form
    const today = new Date().toISOString().slice(0, 10);
    await page.fill('input[id="dueDate"]', today);
    await page.fill('input[id="periodStart"]', '2026-06-01');
    await page.fill('input[id="periodEnd"]', '2026-06-30');

    // Submit
    await page.getByRole('button', { name: 'Generate Bills' }).click();

    // Verify success message appears in modal
    await expect(page.locator('text=Generation Complete!')).toBeVisible();
    await expect(page.locator('text=Successfully created 1 monthly maintenance invoices')).toBeVisible();

    // Close success screen
    await page.getByRole('button', { name: 'Close' }).click();

    // Logout Admin
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // === PHASE 2: Resident checks invoice and pays online ===
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);

    // Go to Billing
    await page.getByRole('button', { name: 'Billing' }).click();

    // Pay Now
    await page.getByRole('button', { name: 'Pay Now' }).first().click();

    // Fill Card Form
    await page.fill('input[id="cardHolder"]', seededData.member.name);
    await page.fill('input[id="cardNumber"]', '4111222233334444');
    await page.fill('input[id="expiry"]', '12/28');
    await page.fill('input[id="cvv"]', '123');

    // Click Complete Payment
    await page.getByRole('button', { name: 'Complete Payment' }).click();

    // Verify approved screen
    await expect(page.locator('text=Payment Approved')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Back to Ledger' }).click();

    // Verify status shows Paid in list
    await expect(page.locator('text=Paid').first()).toBeVisible();
  });
});
