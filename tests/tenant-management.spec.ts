import { test, expect } from '@playwright/test';

const BACKEND_API = 'http://localhost:8000/api/v1';

test.describe('Tenant & Team Management', () => {
    let tenantId: string;
    let adminSecret: string;
    let slug: string;
    const tenantName = 'Team Mgmt Corp';

    test.beforeAll(async ({ request }) => {
        slug = `team-test-${Date.now()}`;
        const res = await request.post(`${BACKEND_API}/tenants`, {
            data: { name: tenantName, slug }
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        tenantId = body.tenant_id;
        adminSecret = body.admin_secret;
    });

    test('Admin can update settings and manage team members', async ({ page }) => {
        // 1. Login
        await page.goto(`/en/admin`);
        await page.getByLabel('Tenant ID').fill(tenantId);
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill(adminSecret);
        await page.click('button:has-text("Login")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // 2. Go to Settings
        await page.click('text=Settings');
        await expect(page.locator('h6', { hasText: 'General Settings' })).toBeVisible();

        // 3. Update Logo & Name
        await page.getByRole('textbox', { name: 'Tenant Name' }).fill('Team Mgmt Corp Updated');
        await page.getByRole('textbox', { name: 'Logo URL' }).fill('https://via.placeholder.com/50');
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByText('Settings updated successfully')).toBeVisible();

        // 4. Add Team Member
        await page.click('button:has-text("Add Member")');

        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('textbox', { name: 'Username' }).fill('support');
        await page.getByLabel('Password').fill('support123');

        await page.click('button:has-text("Create")');

        // Verify in table
        await expect(page.locator('.MuiDataGrid-row', { hasText: 'support' })).toBeVisible();

        // 5. Logout
        await page.click('a:has-text("Dashboard")');
        await page.click('button:has-text("Logout")');

        await expect(page).toHaveURL(/\/en\/admin\/?$/);
        await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();

        // 6. Tenant Login Page
        await page.goto(`/en/admin/login/${slug}`);
        // Ensure page loaded by checking for a unique element
        await expect(page.locator('h5', { hasText: 'Team Mgmt Corp Updated' })).toBeVisible();
        // Check if logo is present (img tag)
        await expect(page.locator('img[alt="Team Mgmt Corp Updated"]')).toBeVisible();

        // 7. Login as Support
        await page.getByLabel('Username').fill('support');
        await page.getByLabel('Password').fill('support123');
        await page.click('button:has-text("Sign In")');

        await expect(page).toHaveURL(/\/admin\/dashboard/);
        await expect(page.getByText('Team Mgmt Corp Updated')).toBeVisible();
    });
});