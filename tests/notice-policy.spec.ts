import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BACKEND_API = 'http://localhost:8000/api/v1';
const TARGET_TZ = 'Europe/Berlin';

test.describe('Dynamic Lead Time Policy', () => {
    let tenantId: string;
    let eventSlug: string;

    const GENERAL_DELAY_MIN = 60;
    const FIRST_DELAY_MIN = 240;

    test.beforeAll(async ({ request }) => {
        const slug = `notice-test-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const tRes = await request.post(`${BACKEND_API}/tenants`, { data: { name: 'Notice Corp', slug } });
        expect(tRes.ok()).toBeTruthy();
        const tData = await tRes.json();
        tenantId = tData.tenant_id;
        const adminSecret = tData.admin_secret;
        const loginRes = await request.post(`${BACKEND_API}/auth/login`, { data: { tenant_id: tenantId, username: 'admin', password: adminSecret } });
        const csrfToken = (await loginRes.json()).csrf_token;

        eventSlug = 'policy-event';
        await request.post(`${BACKEND_API}/${tenantId}/events`, {
            headers: { 'X-CSRF-Token': csrfToken },
            data: {
                slug: eventSlug,
                title_en: "Policy Test", title_de: "Test",
                desc_en: ".", desc_de: ".",
                location: "Online", payout: "0", host_name: "Bot",
                timezone: TARGET_TZ,
                min_notice_general: GENERAL_DELAY_MIN,
                min_notice_first: FIRST_DELAY_MIN,
                active_start: new Date().toISOString(),
                active_end: dayjs().add(1, 'year').toISOString(),
                duration_min: 60,
                interval_min: 60,
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

    test('Lina Scenario: Empty day applies First Session delay (4h)', async ({ page }) => {
        await page.goto(`/en/book/${tenantId}/${eventSlug}`);
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

        const tzInput = page.locator('input[placeholder="Select Timezone"]');
        await tzInput.click();
        await tzInput.fill(TARGET_TZ);
        await expect(page.locator('ul[role="listbox"]')).toBeVisible();
        await page.locator(`li[role="option"]`, { hasText: TARGET_TZ }).first().click();
        await expect(tzInput).toHaveValue(TARGET_TZ);
        await page.waitForTimeout(500);

        const nowBerlin = dayjs().tz(TARGET_TZ);
        const targetDay = nowBerlin.add(1, 'day');
        const dayNumber = targetDay.date().toString();

        if (targetDay.month() !== nowBerlin.month()) {
            await page.locator('button[title="Next month"]').click();
        }

        const dayBtn = page.locator('button[role="gridcell"]:not([disabled])', { hasText: dayNumber }).first();
        await expect(dayBtn).toBeVisible();
        await dayBtn.click();

        if (nowBerlin.add(5, 'hour').date() !== nowBerlin.date()) {
            console.log("Skipping Lina test: Too late in the day to test +5h slot on same day.");
            return;
        }

        const todayBtn = page.locator('button[aria-current="date"]');
        await todayBtn.click();

        const slot2h = nowBerlin.add(2, 'hour').startOf('hour').format('HH:mm');
        const btn2h = page.locator('button', { hasText: slot2h });

        const slot5h = nowBerlin.add(5, 'hour').startOf('hour').format('HH:mm');
        const btn5h = page.locator('button', { hasText: slot5h });

        console.log(`[Lina] Checking ${slot2h} (Hidden) vs ${slot5h} (Visible) in ${TARGET_TZ}`);

        await expect(btn2h).toBeHidden();
        await expect(btn5h).toBeVisible();
    });

    test('Max Scenario: Existing booking relaxes delay for later slots', async ({ page, request }) => {
        const nowBerlin = dayjs().tz(TARGET_TZ);

        const targetDay = nowBerlin.add(1, 'day');
        const bookingTime = targetDay.set('hour', 10).startOf('hour');

        const dateStr = bookingTime.format('YYYY-MM-DD');
        const timeStr = bookingTime.format('HH:mm');

        console.log(`[Max] Creating anchor booking at ${dateStr} ${timeStr}`);
        await request.post(`${BACKEND_API}/${tenantId}/events/${eventSlug}/book`, {
            data: { date: dateStr, time: timeStr, name: "Anchor", email: "anchor@test.com" }
        });

        await page.goto(`/en/book/${tenantId}/${eventSlug}`);
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

        const tzInput = page.locator('input[placeholder="Select Timezone"]');
        await tzInput.click();
        await tzInput.fill(TARGET_TZ);
        await expect(page.locator('ul[role="listbox"]')).toBeVisible();
        await page.locator(`li[role="option"]`, { hasText: TARGET_TZ }).first().click();
        await page.waitForTimeout(500);

        // Navigate to Tomorrow
        const dayNumber = targetDay.date().toString();
        if (targetDay.month() !== nowBerlin.month()) {
            await page.locator('button[title="Next month"]').click();
        }
        const dayBtn = page.locator('button[role="gridcell"]:not([disabled])', { hasText: dayNumber }).first();
        await dayBtn.click();

        await expect(page.getByText('Available times')).toBeVisible();

        const slot12 = "12:00";
        page.locator('button', { hasText: slot12 });


        const todayBookingTime = nowBerlin.add(5, 'hour').startOf('hour');
        if (todayBookingTime.date() !== nowBerlin.date()) {
            console.log("Skipping Max Scenario: End of day.");
            return;
        }

        await page.reload();
        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

        // Set TZ
        const tzInput2 = page.locator('input[placeholder="Select Timezone"]');
        await tzInput2.click();
        await tzInput2.fill(TARGET_TZ);
        await page.locator(`li[role="option"]`, { hasText: TARGET_TZ }).first().click();
        await page.waitForTimeout(500);

        await page.locator('button[aria-current="date"]').click();

        // 1. Book at +5h
        const dateToday = todayBookingTime.format('YYYY-MM-DD');
        const timeToday = todayBookingTime.format('HH:mm');
        await request.post(`${BACKEND_API}/${tenantId}/events/${eventSlug}/book`, {
            data: { date: dateToday, time: timeToday, name: "Anchor Today", email: "anchor@test.com" }
        });

        // Reload slots (click date again)
        await page.locator('button[aria-current="date"]').click();

        // 2. Check Slot at +2h (Before booking)
        // Should be HIDDEN (First Session Rule: 4h > 2h)
        const slot2h = nowBerlin.add(2, 'hour').startOf('hour').format('HH:mm');
        const btn2h = page.locator('button', { hasText: slot2h });

        // 3. Check Slot at +6h (After booking)
        // Should be VISIBLE (General Rule: 1h < 6h)
        const slot6h = nowBerlin.add(6, 'hour').startOf('hour').format('HH:mm');
        const btn6h = page.locator('button', { hasText: slot6h });

        // Only assert if slots don't cross midnight
        if (nowBerlin.add(6, 'hour').date() === nowBerlin.date()) {
            console.log(`[Max Today] Checking ${slot6h} (Visible) and ${slot2h} (Hidden)`);
            await expect(btn6h).toBeVisible();
            await expect(btn2h).toBeHidden();
        }
    });
});