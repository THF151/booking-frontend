import { test, expect } from '@playwright/test';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('SaaS Booking Lifecycle', () => {
    let tenantId: string;
    let adminSecret: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let slug: string;

    test.beforeAll(async ({ request }) => {
        const randomSlug = `test-corp-${Math.floor(Math.random() * 10000)}`;
        const res = await request.post(`${BACKEND_API}/tenants`, {
            data: { name: 'Playwright Test Corp', slug: randomSlug }
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        tenantId = body.tenant_id;
        adminSecret = body.admin_secret;
        slug = randomSlug;
    });

    test('Admin can login, create event, and User can book it', async ({ page }) => {
        // 1. Admin Login
        await page.goto(`/en/admin`);
        await page.getByLabel('Tenant ID').fill(tenantId);
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill(adminSecret);
        await page.click('button:has-text("Login")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // 2. Create Event (New Flow)
        const createBtn = page.locator('button:has-text("Create Event")');
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        // Expect navigation to creation page
        await expect(page).toHaveURL(/\/admin\/events\/create/);
        await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible();

        const eventSlug = `launch-${Math.floor(Math.random() * 1000)}`;

        // General Section is default
        await page.getByLabel('Slug').fill(eventSlug);
        await page.getByLabel('Title (English)').fill('Launch Party');
        await page.getByLabel('Title (German)').fill('Launch Party DE');

        await page.click('text=Availability');
        await expect(page.getByText('Schedule Type')).toBeVisible();

        await page.getByLabel('Duration (min)').fill('60');

        await page.click('button:has-text("Save")');

        // Expect redirect to Event Dashboard
        await expect(page).toHaveURL(new RegExp(`/admin/events/${eventSlug}`));
        await expect(page.getByRole('heading', { name: 'Launch Party' })).toBeVisible();

        // 3. Public Booking
        await page.goto(`/en/book/${tenantId}/${eventSlug}`);
        await expect(page.locator('h5', { hasText: 'Launch Party' })).toBeVisible();

        const nextMonthBtn = page.locator('button[title="Next month"]');
        await expect(nextMonthBtn).toBeVisible();
        await nextMonthBtn.click();

        const dayButton = page.locator('button[role="gridcell"]:not([disabled])').first();
        await expect(dayButton).toBeVisible();
        await dayButton.click();

        const slotBtn = page.locator('button:has-text(":")').first();
        await expect(slotBtn).toBeVisible();
        await slotBtn.click();

        await page.click('button:has-text("Confirm")');

        await page.getByLabel('Full Name').fill('Playwright Tester');
        await page.getByLabel('Email Address').fill('bot@test.com');

        await page.click('button:has-text("Schedule Meeting")');

        await expect(page.getByText('Booking Confirmed')).toBeVisible({ timeout: 15000 });
    });
});