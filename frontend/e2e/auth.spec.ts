import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginIfRequired, visitAuthenticated } from './auth-helpers';

const configureShortSession = async (page: Page, values = { idleTimeoutMs: 6000, warningMs: 3000, mockLifetimeMs: 60000 }) => {
  await page.addInitScript((config) => { (globalThis as { __SMARTIAM_MOCK_CONFIG__?: typeof config }).__SMARTIAM_MOCK_CONFIG__ = config; }, values);
};
const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'My Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign Out', exact: true }).click();
};

test('login validation, failure, password visibility and username-only preference', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByText('Enter a username or email.', { exact: true })).toBeVisible();
  await expect(page.getByText('Enter your password.', { exact: true })).toBeVisible();
  await page.locator('#username').fill('admin@example.test'); await page.locator('#password').fill('wrong');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
  await expect(page.locator('#password')).toHaveValue('');
  await page.locator('#password').fill('Demo-only!23');
  await page.getByRole('button', { name: 'Show password', exact: true }).click(); await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await page.getByLabel('Remember username').check();
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administration');
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage.local).toEqual({ 'smartiam.rememberedUsername': 'admin@example.test' }); expect(storage.session).toEqual({});
  await page.reload(); await expect(page.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
  await expect(page.locator('#username')).toHaveValue('admin@example.test'); await expect(page.locator('#password')).toHaveValue('');
});

test('guards, permission-filtered menus/actions and read-only profile', async ({ page }) => {
  await visitAuthenticated(page, '/administration/system', 'reader@example.test');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Access denied');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'System Configuration', exact: true })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Create Configuration', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'My Profile', exact: true }).click(); await page.getByRole('link', { name: 'View My Profile' }).click();
  await expect(page.locator('#profile-displayName')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeDisabled();
});

test('profile validates, saves, cancels and refreshes the header user', async ({ page }) => {
  await visitAuthenticated(page, '/profile');
  await page.getByLabel('Email', { exact: true }).fill('not-an-email');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('updated@example.test');
  await page.getByLabel('Display name', { exact: true }).fill('Updated Administrator');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Profile saved.');
  await expect(page.locator('.profile-copy strong')).toHaveText('Updated Administrator');
  await page.getByLabel('Department', { exact: true }).fill('Discard this change');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Department', { exact: true })).toHaveValue('IT — IAM');
});

test('logout confirmation and guarded back navigation', async ({ page }) => {
  await visitAuthenticated(page, '/profile');
  await page.getByRole('button', { name: 'My Profile', exact: true }).click(); await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await logout(page); await expect(page).toHaveURL(/\/login\?reason=logout/);
  await page.goBack(); await expect(page.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
});

test('development showcase previews do not sign in and permission refresh removes active access', async ({ page }) => {
  await visitAuthenticated(page, '/auth-showcase');
  await page.getByLabel('Login form state').selectOption('invalid'); await expect(page.getByRole('alert')).toContainText('Preview: invalid');
  await page.getByLabel('Login form state').selectOption('normal');
  await page.getByRole('button', { name: 'Preview Idle warning', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Preview only'); await page.getByRole('button', { name: 'Close preview' }).click();
  await page.getByRole('button', { name: 'Remove configuration permission', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Configuration permitted', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove showcase permission', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Access denied');
});

test('idle countdown renews only on confirmation and can log out immediately', async ({ page }) => {
  await configureShortSession(page); await visitAuthenticated(page, '/administration');
  const warning = page.getByRole('dialog', { name: 'Session expiring', exact: true });
  await expect(warning).toBeVisible({ timeout: 10000 });
  await warning.getByRole('button', { name: 'Continue Session', exact: true }).click();
  await expect(warning).toBeHidden();
  await expect(warning).toBeVisible({ timeout: 10000 });
  await warning.getByRole('button', { name: 'Logout Now', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
});

test('absolute mock expiry wins over activity and redirects to login', async ({ page }) => {
  await configureShortSession(page, { idleTimeoutMs: 60000, warningMs: 2000, mockLifetimeMs: 5000 });
  await visitAuthenticated(page, '/administration');
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700); }
  await expect(page.getByRole('dialog', { name: 'Session expired', exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Back to Sign In', exact: true }).click();
  await expect(page.locator('#password')).toHaveValue(''); await expect(page).toHaveURL(/reason=expired/);
});

test('logout synchronizes across tabs without storing sessions', async ({ context, page }) => {
  await visitAuthenticated(page, '/administration');
  const second = await context.newPage(); await visitAuthenticated(second, '/profile');
  await logout(page);
  await expect(second.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
  expect(await second.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'smartiam.rememberedUsername'))).toEqual([]);
});

test('meaningful activity in one tab updates the other tab idle deadline', async ({ context, page }) => {
  await configureShortSession(page); await visitAuthenticated(page, '/administration');
  const second = await context.newPage(); await configureShortSession(second); await visitAuthenticated(second, '/profile');
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1100); }
  await expect(second.getByRole('dialog', { name: 'Session expiring', exact: true })).toBeHidden();
});

for (const width of [390, 1672]) {
  test(`login/profile accessibility and reflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 941 }); await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await loginIfRequired(page); await page.getByRole('button', { name: 'My Profile', exact: true }).click(); await page.getByRole('link', { name: 'View My Profile' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  });
}

test('login, profile and warning visual baselines', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-15T02:00:00Z'));
  await page.goto('/login'); await expect(page.getByRole('heading', { name: 'Sign in to SmartIAM' })).toBeVisible();
  await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  await visitAuthenticated(page, '/profile'); await expect(page.locator('#profile-displayName')).toHaveValue('Demo Administrator');
  await expect(page).toHaveScreenshot('profile.png', { fullPage: true });
  await visitAuthenticated(page, '/auth-showcase'); await page.getByRole('button', { name: 'Preview Idle warning', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveScreenshot('idle-warning.png');
});
