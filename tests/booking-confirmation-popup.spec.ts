import { test, expect } from '@playwright/test';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Booking Confirmation Popup', () => {
    let tenantId: string;
    let eventSlug: string;

    test.beforeAll(async ({ request }) => {
        // 1. Create Tenant
        const randomSuffix = Math.floor(Math.random() * 1000000);
        const slug = `popup-${Date.now()}-${randomSuffix}`;

        const tRes = await request.post(`${BACKEND_API}/tenants`, {
            data: { name: 'Popup Test Corp', slug: slug }
        });
        expect(tRes.ok(), `Create tenant failed: ${tRes.status()} ${tRes.statusText()}`).toBeTruthy();
        const tData = await tRes.json();
        tenantId = tData.tenant_id;
        const adminSecret = tData.admin_secret;

        // 2. Login to get CSRF token
        const loginRes = await request.post(`${BACKEND_API}/auth/login`, {
            data: { tenant_id: tenantId, username: 'admin', password: adminSecret }
        });
        expect(loginRes.ok(), `Login failed: ${loginRes.status()}`).toBeTruthy();
        const loginBody = await loginRes.json();
        const csrfToken = loginBody.csrf_token;

        // 3. Create Event
        eventSlug = 'meeting-event';
        const eventData = {
            slug: eventSlug,
            title_en: "Popup Check Event",
            title_de: "Popup Test",
            desc_en: "Testing the popup date/time",
            desc_de: "Testing",
            location: "Online",
            payout: "0",
            host_name: "Tester",
            timezone: "UTC",
            active_start: new Date().toISOString(),
            active_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
            duration_min: 60,
            interval_min: 60,
            max_participants: 1,
            image_url: "https://via.placeholder.com/150",
            config: {
                monday: [{ start: "09:00", end: "17:00" }],
                tuesday: [{ start: "09:00", end: "17:00" }],
                wednesday: [{ start: "09:00", end: "17:00" }],
                thursday: [{ start: "09:00", end: "17:00" }],
                friday: [{ start: "09:00", end: "17:00" }],
            },
            access_mode: "OPEN"
        };

        const createRes = await request.post(`${BACKEND_API}/${tenantId}/events`, {
            data: eventData,
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });
        expect(createRes.ok(), `Create event failed: ${createRes.status()}`).toBeTruthy();
    });

    test('should display correct date and time in success popup', async ({ page }) => {
        await page.goto(`/en/book/${tenantId}/${eventSlug}`);

        // 1. Select Date
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

        const headerLabel = page.locator('.MuiPickersCalendarHeader-label');
        await expect(headerLabel).toBeVisible();
        const monthYearText = await headerLabel.textContent();

        const dayButton = page.locator('button[role="gridcell"]:not([disabled])').first();
        await expect(dayButton).toBeVisible({ timeout: 10000 });

        const dayNumber = await dayButton.textContent();

        console.log(`Selected Day: ${dayNumber} of ${monthYearText}`);

        await dayButton.click();

        // 2. Select Time Slot
        const slotButton = page.locator('button', { hasText: ':' }).first();
        await expect(slotButton).toBeVisible();
        const timeText = await slotButton.textContent();
        expect(timeText).toBeTruthy();
        console.log(`Selected Time: ${timeText}`);

        await slotButton.click();

        // 3. Confirm Slot
        const confirmBtn = page.locator('button', { hasText: 'Confirm' });
        await expect(confirmBtn).toBeVisible();
        await confirmBtn.click();

        // 4. Fill Form
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await page.fill('input[name="name"]', 'Popup Tester');
        await page.fill('input[name="email"]', 'test@popup.com');

        // Submit
        await page.click('button[type="submit"]');

        // 5. Verify Success Popup
        const dialog = page.locator('div[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Verify Time
        await expect(dialog).toContainText(timeText!);

        // Verify Date
        await expect(dialog).toContainText(`${dayNumber}.`);
        const [month, year] = monthYearText!.split(' ');
        await expect(dialog).toContainText(month);
        await expect(dialog).toContainText(year);
    });
});