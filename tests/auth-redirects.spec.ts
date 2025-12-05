import { test, expect } from '@playwright/test';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Authentication & Redirection Logic', () => {
    let tenantId: string;
    let adminSecret: string;
    const tenantName = 'Auth Check Corp';

    test.beforeAll(async ({ request }) => {
        const slug = `auth-check-${Date.now()}`;
        const res = await request.post(`${BACKEND_API}/tenants`, {
            data: { name: tenantName, slug }
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        tenantId = body.tenant_id;
        adminSecret = body.admin_secret;
        console.log(`[Setup] Tenant created: ${tenantId}`);
    });

    test('should handle protected routes and guest routes correctly', async ({ page }) => {
        // --- SCENARIO 1: GUEST ACCESS PROTECTION ---

        // 1. Attempt to access Dashboard directly without login
        await page.goto('/en/admin/dashboard');

        // 2. Expect redirect to Login Page
        await expect(page).toHaveURL(/\/en\/admin\/?$/);
        await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();

        // --- SCENARIO 2: LOGIN FLOW ---

        // 3. Perform Login
        await page.getByLabel('Tenant ID').fill(tenantId);
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill(adminSecret);
        await page.click('button:has-text("Login")');

        // 4. Expect redirect to Dashboard
        await expect(page).toHaveURL(/\/en\/admin\/dashboard/);

        await expect(page.getByText(tenantName)).toBeVisible();

        // --- SCENARIO 3: LOGGED-IN USER REDIRECTION ---

        // 5. Attempt to access Login page while authenticated
        await page.goto('/en/admin');

        // 6. Expect redirect BACK to Dashboard
        await expect(page).toHaveURL(/\/en\/admin\/dashboard/);
        await expect(page.getByRole('button', { name: 'Create Event' })).toBeVisible();

        // --- SCENARIO 4: LOGOUT FLOW ---

        // 7. Click Logout
        await page.click('button:has-text("Logout")');

        // 8. Expect redirect to Login Page
        await expect(page).toHaveURL(/\/en\/admin\/?$/);
        await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();

        // 9. Verify Dashboard is protected again
        await page.goto('/en/admin/dashboard');
        await expect(page).toHaveURL(/\/en\/admin\/?$/);
    });
});