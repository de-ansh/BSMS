import { test, expect } from '@playwright/test';
import { createAdminUnitAndMember } from './helpers';

test.describe('Community Forums & Polls Workflows', () => {
  const baseURL = 'http://localhost:5173';
  let seededData: any;
  const postTitle = `Gym renovation discussion ${Date.now()}`;
  const postContent = `Should we upgrade the community gym equipment this year? Let's discuss.`;
  const replyContent = `Yes, definitely! The treadmills are outdated.`;
  const pollQuestion = `Select your preferred paint color for the main lobby:`;
  const pollOption1 = `Warm Beige`;
  const pollOption2 = `Cool Slate`;

  test.beforeAll(async ({ request }) => {
    // Seed building, admin, unit, and resident member
    seededData = await createAdminUnitAndMember(request);
  });

  test('should support creating posts, commenting, creating polls, and voting', async ({ page }) => {
    // 1. Login as Resident
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);
    await expect(page.locator(`text=${seededData.member.email}`)).toBeVisible();

    // 2. Navigate to Community Hub
    await page.goto(baseURL + '/community');
    await expect(page.locator('text=Community Hub')).toBeVisible();

    // 3. Create a Discussion Thread
    await page.getByRole('button', { name: 'Start Discussion' }).first().click();
    await page.fill('input[id="postTitle"]', postTitle);
    await page.fill('textarea[id="postContent"]', postContent);
    await page.getByRole('button', { name: 'Publish' }).click();

    // Verify post appears in feed
    await expect(page.locator(`text=${postTitle}`)).toBeVisible();

    // 4. View Details and post a Comment/Reply
    await page.locator(`text=${postTitle}`).first().click();
    await expect(page.locator(`text=${postContent}`)).toBeVisible();

    await page.fill('input[placeholder="Write a reply..."]', replyContent);
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify comment is on page
    await expect(page.locator(`text=${replyContent}`)).toBeVisible();

    // 5. Logout Resident
    await page.evaluate(() => localStorage.removeItem('bsms_token'));

    // 6. Login as Admin
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.admin.email);
    await page.fill('input[type="password"]', seededData.admin.password);
    await page.getByText('Society Admin', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${seededData.admin.email}`)).toBeVisible();

    // 7. Go to Community Hub as Admin
    await page.goto(baseURL + '/community');
    await expect(page.locator('text=Community Hub')).toBeVisible();

    // Verify Resident's post is visible to Admin
    await expect(page.locator(`text=${postTitle}`)).toBeVisible();

    // 8. Go to Polls tab
    await page.getByRole('button', { name: 'Surveys & Polls' }).click();

    // 9. Create a Poll
    await page.getByRole('button', { name: 'Create Poll' }).first().click();
    await page.fill('input[id="pollQuestion"]', pollQuestion);
    // Fill first two options
    await page.locator('form input').nth(1).fill(pollOption1);
    await page.locator('form input').nth(2).fill(pollOption2);
    await page.locator('form').getByRole('button', { name: 'Create Poll', exact: true }).click();

    // Verify poll question is visible
    await expect(page.locator(`text=${pollQuestion}`)).toBeVisible();

    // 10. Logout Admin
    await page.evaluate(() => localStorage.removeItem('bsms_token'));

    // 11. Login as Resident again to vote
    await page.goto(baseURL + '/login');
    await page.fill('input[type="email"]', seededData.member.email);
    await page.fill('input[type="password"]', 'resident123');
    await page.getByText('Resident', { exact: true }).click();
    await page.getByText('INITIATE SESSION').click();
    await expect(page).toHaveURL(/.*\/notices/);
    await expect(page.locator(`text=${seededData.member.email}`)).toBeVisible();

    // 12. Navigate to Community Hub -> Polls tab
    await page.goto(baseURL + '/community');
    await expect(page.locator('text=Community Hub')).toBeVisible();
    await page.getByRole('button', { name: 'Surveys & Polls' }).click();

    // Verify resident sees the poll question and option button
    await expect(page.locator(`text=${pollQuestion}`)).toBeVisible();
    
    // 13. Cast Vote
    await page.getByRole('button', { name: pollOption1 }).click();

    // Verify vote percentage and totals update
    await expect(page.locator('text=100%')).toBeVisible();
    await expect(page.locator('text=Total: 1 vote')).toBeVisible();
  });
});
