import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Past Slot Filtering (Real-Time)', () => {
    let tenantId: string;
    let eventSlug: string;

    test.beforeAll(async ({ request }) => {
        const slug = `past-fe-check-${Date.now()}`;
        const tRes = await request.post(`${BACKEND_API}/tenants`, { data: { name: 'FE Past Corp', slug } });
        const tData = await tRes.json();
        tenantId = tData.tenant_id;
        const adminSecret = tData.admin_secret;

        const loginRes = await request.post(`${BACKEND_API}/auth/login`, {
            data: { tenant_id: tenantId, username: 'admin', password: adminSecret }
        });
        const csrfToken = (await loginRes.json()).csrf_token;

        eventSlug = 'rt-event';
        await request.post(`${BACKEND_API}/${tenantId}/events`, {
            headers: { 'X-CSRF-Token': csrfToken },
            data: {
                slug: eventSlug,
                title_en: "Real Time", title_de: "Echtzeit",
                desc_en: ".", desc_de: ".",
                location: "Online", payout: "0", host_name: "Bot",
                timezone: "UTC",
                active_start: new Date().toISOString(),
                active_end: dayjs().add(7, 'day').toISOString(),
                duration_min: 15,
                interval_min: 15,
                max_participants: 1,
                image_url: "https://via.placeholder.com/150",
                config: {
                    monday: [{start: "00:00", end: "23:59"}],
                    tuesday: [{start: "00:00", end: "23:59"}],
                    wednesday: [{start: "00:00", end: "23:59"}],
                    thursday: [{start: "00:00", end: "23:59"}],
                    friday: [{start: "00:00", end: "23:59"}],
                    saturday: [{start: "00:00", end: "23:59"}],
                    sunday: [{start: "00:00", end: "23:59"}],
                },
                access_mode: "OPEN"
            }
        });
    });

    test('UI should not display past time slots for today', async ({ page }) => {
        await page.goto(`/en/book/${tenantId}/${eventSlug}`);

        // 1. Select Today
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
        const todayBtn = page.locator('button[aria-current="date"]');

        if (await todayBtn.isDisabled()) {
            console.log("Today is disabled (Late night). Skipping verification.");
            return;
        }
        await todayBtn.click();

        // 2. Wait for slots
        const slotContainer = page.locator('div.MuiStack-root').nth(1);
        await expect(slotContainer).toBeVisible();

        // 3. Set timezone to UTC
        const tzInput = page.locator('input[placeholder="Select Timezone"]');
        await tzInput.fill('UTC');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        // Wait for reload/update
        await page.waitForTimeout(500);

        const now = new Date();
        // Convert "Now" to UTC for comparison since we set UI to UTC
        const utcHour = now.getUTCHours();
        const utcMinute = now.getUTCMinutes();

        // Check 30 mins ago in UTC
        // E.g. Now is 14:10 UTC. Past is 13:40 UTC.
        // 13:00, 13:15, 13:30, 13:45 UTC should be gone.

        if (utcHour >= 1) {
            const checkHour = utcHour - 1;
            const checkTime = `${String(checkHour).padStart(2, '0')}:00`; // e.g. "13:00"

            console.log(`Verifying slot ${checkTime} is hidden (Current UTC: ${utcHour}:${utcMinute})`);
            const pastSlot = page.locator('button', { hasText: checkTime });
            await expect(pastSlot).toBeHidden();
        }
    });
});