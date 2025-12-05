import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Specific Date Boundary Booking (Relative)', () => {
    let tenantId: string;
    let eventSlug: string;

    const targetDateUtc = dayjs.utc().add(2, 'day').startOf('day').add(14, 'hour'); // 14:00 UTC
    const activeStartUtc = targetDateUtc.add(30, 'minute'); // 14:30 UTC
    const targetTz = 'Europe/Berlin';

    test.beforeAll(async ({ request }) => {
        const slug = `boundary-rel-${Date.now()}`;
        const tRes = await request.post(`${BACKEND_API}/tenants`, { data: { name: 'Rel Boundary Corp', slug } });
        const tData = await tRes.json();
        tenantId = tData.tenant_id;
        const adminSecret = tData.admin_secret;

        const loginRes = await request.post(`${BACKEND_API}/auth/login`, {
            data: { tenant_id: tenantId, username: 'admin', password: adminSecret }
        });
        const csrfToken = (await loginRes.json()).csrf_token;

        eventSlug = 'specific-rel-event';
        await request.post(`${BACKEND_API}/${tenantId}/events`, {
            headers: { 'X-CSRF-Token': csrfToken },
            data: {
                slug: eventSlug,
                title_en: "Specific Rel", title_de: "Spezifisch Rel",
                desc_en: ".", desc_de: ".",
                location: "Online", payout: "0", host_name: "Bot",
                timezone: targetTz,
                active_start: activeStartUtc.toISOString(),
                active_end: targetDateUtc.add(1, 'year').toISOString(),
                duration_min: 10,
                interval_min: 20,
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

    test('Boundary check logic using future relative dates', async ({ page }) => {
        await page.goto(`/en/book/${tenantId}/${eventSlug}`);
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

        // 1. Robust Timezone Selection
        const tzInput = page.locator('input[placeholder="Select Timezone"]');
        await tzInput.click();
        await tzInput.fill(targetTz);

        // Wait for the dropdown options to appear
        await expect(page.locator('ul[role="listbox"]')).toBeVisible();

        await page.locator(`li[role="option"]`, { hasText: targetTz }).first().click();

        // Verify timezone is set correctly in the input value
        await expect(tzInput).toHaveValue(targetTz);

        // Wait for any potential re-fetch/render
        await page.waitForTimeout(500);

        // 2. Navigate to Target Date
        const localTargetDate = targetDateUtc.tz(targetTz);
        const dayNumber = localTargetDate.date().toString();

        if (localTargetDate.month() !== dayjs().month()) {
            await page.locator('button[title="Next month"]').click();
        }

        const dayBtn = page.locator('button[role="gridcell"]:not([disabled])', { hasText: dayNumber }).first();
        await expect(dayBtn).toBeVisible();
        await dayBtn.click();

        // 3. Verify Slots
        const slot1420_Utc = targetDateUtc.set('minute', 20); // 14:20 UTC
        const slot1440_Utc = targetDateUtc.set('minute', 40); // 14:40 UTC

        const slotHiddenStr = slot1420_Utc.tz(targetTz).format('HH:mm');
        const slotVisibleStr = slot1440_Utc.tz(targetTz).format('HH:mm');

        console.log(`Checking slots for ${localTargetDate.format('YYYY-MM-DD')} (${targetTz}):`);
        console.log(`  Hidden (UTC 14:20) -> Expecting UI: ${slotHiddenStr}`);
        console.log(`  Visible (UTC 14:40) -> Expecting UI: ${slotVisibleStr}`);

        const btnVisible = page.locator('button', { hasText: slotVisibleStr });
        const btnHidden = page.locator('button', { hasText: slotHiddenStr });

        await expect(btnVisible).toBeVisible();
        await expect(btnHidden).toBeHidden();

        // 4. Proceed
        await btnVisible.click();
        await expect(page.locator('button', { hasText: 'Confirm' })).toBeVisible();
    });
});