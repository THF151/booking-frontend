import { test, expect } from '@playwright/test';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Timezone & Restricted Access Flow', () => {
    let tenantId: string;
    let adminSecret: string;
    let eventSlug: string;
    const tenantName = 'Timezone Corp';

    test.beforeAll(async ({ request }) => {
        const randomId = Math.floor(Math.random() * 10000);
        const slug = `tz-test-${randomId}`;
        const res = await request.post(`${BACKEND_API}/tenants`, {
            data: { name: tenantName, slug: slug }
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        tenantId = body.tenant_id;
        adminSecret = body.admin_secret;
        eventSlug = `restricted-evt-${randomId}`;

        console.log(`[Setup] Tenant: ${tenantId}, Secret: ${adminSecret}`);
    });

    test('Restricted Event Booking maintains correct Timezone', async ({ page }) => {
        await page.goto(`/en/admin`);
        await page.getByLabel('Tenant ID').fill(tenantId);
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill(adminSecret);
        await page.click('button:has-text("Login")');

        await expect(page).toHaveURL(/\/admin\/dashboard/);
        await expect(page.getByText(tenantName)).toBeVisible();

        // Create Event - New Flow
        await page.click('button:has-text("Create Event")');
        await expect(page).toHaveURL(/\/admin\/events\/create/);
        await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible();

        // General Section
        await page.getByLabel('Slug').fill(eventSlug);
        await page.getByLabel('Title (English)').fill('Secret Meeting');
        await page.getByLabel('Title (German)').fill('Geheimtreffen');

        // Set Timezone
        await page.getByLabel('Event Timezone').fill('Europe/Berlin');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await page.getByLabel('Access Mode').click();
        await page.getByRole('option', { name: 'Restricted (Token)' }).click();

        // Save
        await page.click('button:has-text("Save")');

        // Expect redirect to Event Dashboard
        await expect(page).toHaveURL(new RegExp(`/admin/events/${eventSlug}`));
        await expect(page.getByRole('heading', { name: 'Secret Meeting' })).toBeVisible();

        // Manage Tokens
        await page.getByRole('tab', { name: 'Invitees' }).click();

        const inviteeEmail = 'vip@test.com';
        await page.getByLabel('Import Emails').fill(inviteeEmail);
        await page.click('button:has-text("Generate Tokens")');
        await expect(page.getByText(/Imported 1 tokens/)).toBeVisible();

        const row = page.locator('.MuiDataGrid-row', { hasText: inviteeEmail });
        await expect(row).toBeVisible();
        const tokenCell = row.locator('[data-field="token"]');
        const tokenText = await tokenCell.textContent();
        expect(tokenText).toBeTruthy();

        const bookingUrl = `/en/book/${tenantId}/${eventSlug}?accessToken=${tokenText}`;
        await page.goto(bookingUrl);

        await expect(page.getByText('Secret Meeting')).toBeVisible();

        // Select Berlin Timezone in UI to match expectations
        const tzInput = page.locator('input[placeholder="Select Timezone"]');
        await tzInput.fill('Europe/Berlin');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        const nextMonthBtn = page.locator('button[title="Next month"]');
        await expect(nextMonthBtn).toBeVisible();
        await nextMonthBtn.click();

        await page.locator('button[role="gridcell"]:has-text("15")').first().click();

        const slotBtn = page.locator('button:has-text("10:00")');
        await expect(slotBtn).toBeVisible();
        await slotBtn.click();
        await page.click('button:has-text("Confirm")');

        await page.getByLabel('Full Name').fill('Timezone Tester');
        await page.getByLabel('Email Address').fill(inviteeEmail);
        await page.click('button:has-text("Schedule Meeting")');

        await expect(page.getByText('Booking Confirmed')).toBeVisible({ timeout: 15000 });

        // Verify Timezone in Admin Dashboard (should display in Event TZ: Berlin)
        await page.goto(`/en/admin/events/${eventSlug}`);
        await expect(page.getByRole('heading', { name: 'Secret Meeting' })).toBeVisible();

        await page.getByRole('tab', { name: 'Bookings' }).click();

        const bookingRow = page.locator('.MuiDataGrid-row', { hasText: 'Timezone Tester' });
        await expect(bookingRow).toBeVisible();

        const timeCell = bookingRow.locator('[data-field="start_time"]');
        const timeText = await timeCell.textContent();

        console.log(`[Test] Displayed Time: ${timeText}`);
        expect(timeText).toContain('10:00');
    });
});