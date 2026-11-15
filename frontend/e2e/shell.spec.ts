import { loginIfRequired, visitAuthenticated } from './auth-helpers';
import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' });
const loaded = async (page: Page) => {
  if(new URL(page.url()).pathname === '/dashboard') {
    await expect(page.locator('smart-dashboard-widget').first()).toBeVisible();
    return;
  }
  await expect(page.getByRole('region', { name: 'Administration metrics — mock data' })).toHaveAttribute('aria-busy', 'false');
};
const openScenario = async (page: Page, label: string) => {
  await page.getByRole('button', { name: 'System Actions', exact: true }).click();
  await page.getByRole('button', { name: label, exact: true }).click();
};
const accessibility = async (page: Page) => {
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
};

test('lazy navigation, breadcrumbs, deep links and browser history', async ({ page }) => {
  await visitAuthenticated(page, '/');
  await expect(page).toHaveTitle('Administration | SmartIAM');
  await mainNavigation(page).getByRole('link', { name: 'Roles & Permissions', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roles & Permissions');
  await expect(mainNavigation(page).getByRole('link', { name: 'Roles & Permissions', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Roles & Permissions');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administration');
  await mainNavigation(page).getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
  await loaded(page);
  await expect(mainNavigation(page).locator('[aria-current="page"]')).toHaveCount(1);
  await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); await loginIfRequired(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
});

test('desktop collapse and nested group keyboard navigation', async ({ page }) => {
  await visitAuthenticated(page, '/administration');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.sidebar')).toHaveCSS('width', '68px');
  await mainNavigation(page).getByRole('button', { name: 'Administration', exact: true }).click();
  await expect(page.locator('.sidebar')).toHaveCSS('width', '274px');
  await mainNavigation(page).getByRole('button', { name: 'Administration', exact: true }).click();
  await expect(mainNavigation(page).getByRole('link', { name: 'Admin Dashboard' })).toBeHidden();
  const identity = mainNavigation(page).getByRole('button', { name: 'Identity Management', exact: true });
  await identity.focus(); await page.keyboard.press('Enter');
  await expect(identity).toHaveAttribute('aria-expanded', 'true');
  await mainNavigation(page).getByRole('link', { name: 'Lifecycle Events', exact: true }).click();
  await expect(page).toHaveURL(/identity\/lifecycle$/);
  await expect(identity).toHaveAttribute('aria-expanded', 'true');
  await expect(mainNavigation(page).getByRole('link', { name: 'Lifecycle Events', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile drawer traps focus, locks background and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAuthenticated(page, '/administration');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  await expect(mainNavigation(page)).toBeHidden();
  await toggle.click();
  await expect(mainNavigation(page)).toBeVisible();
  await expect(page.locator('.workspace')).toHaveAttribute('inert');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await mainNavigation(page).getByRole('button', { name: 'Audit & Reporting', exact: true }).click();
  await mainNavigation(page).getByRole('link', { name: 'Audit Logs', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'SmartIAM home' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(mainNavigation(page)).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await toggle.click();
  await mainNavigation(page).getByRole('link', { name: 'Roles & Permissions', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roles & Permissions');
  await expect(mainNavigation(page)).toBeHidden();
  await expect(page.locator('#main-content')).toBeFocused();
});

test('mobile backdrop and viewport resize dismiss navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAuthenticated(page, '/administration');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('.backdrop').click({ position: { x: 360, y: 500 } });
  await expect(mainNavigation(page)).toBeHidden();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.setViewportSize({ width: 1672, height: 941 });
  await expect(page.locator('.workspace')).not.toHaveAttribute('inert');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('notification and profile disclosures close and navigate', async ({ page }) => {
  await visitAuthenticated(page, '/administration');
  const bell = page.getByRole('button', { name: 'Notifications', exact: true });
  await bell.click();
  await expect(page.locator('#notification-panel')).toContainText('Mark all as read');
  await page.keyboard.press('Escape');
  await expect(bell).toBeFocused();
  await expect(bell).toHaveAttribute('aria-expanded', 'false');
  const profile = page.getByRole('button', { name: 'My Profile', exact: true });
  await profile.click();
  await expect(page.locator('#profile-panel')).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(profile).toHaveAttribute('aria-expanded', 'false');
  await profile.click();
  await page.getByRole('link', { name: 'View My Profile' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My Profile');
  await bell.click();
  await page.getByRole('link', { name: 'View all notifications' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notifications');
});

test('mock loading, empty and error states recover to sample data', async ({ page }) => {
  await visitAuthenticated(page, '/administration');
  await loaded(page);
  await openScenario(page, 'Show empty state');
  await expect(page.getByRole('heading', { name: 'Loading administration dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No dashboard data', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load sample data' }).click();
  await loaded(page);
  await openScenario(page, 'Simulate error');
  await expect(page.getByRole('alert')).toContainText('Dashboard unavailable');
  await page.getByRole('button', { name: 'Try again' }).click();
  await loaded(page);
  await expect(page.getByRole('article', { name: 'Total Users', exact: true })).toContainText('142');
});

test('typed role search handles matches and empty results', async ({ page }) => {
  await visitAuthenticated(page, '/administration'); await loaded(page);
  const search = page.getByRole('searchbox', { name: 'Search sample roles' });
  await search.fill('Business');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await search.fill('does-not-exist');
  await expect(page.getByRole('heading', { name: 'No matching roles' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
});

test('page search and contextual actions lead to working routes', async ({ page }) => {
  await visitAuthenticated(page, '/administration');
  const search = page.getByRole('searchbox', { name: 'Search pages', exact: true });
  await expect(search).toBeVisible();
  await page.keyboard.press('Control+k'); await expect(search).toBeFocused();
  await search.fill('unknown-page'); await search.press('Enter');
  await expect(page.locator('.search-feedback')).toContainText('No matching page');
  await search.fill('Roles'); await search.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roles & Permissions');
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Administration' }).click();
  await page.getByRole('link', { name: 'Create Configuration' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('System Configuration');
});

test('theme changes token surfaces and survives route navigation', async ({ page }) => {
  await visitAuthenticated(page, '/administration');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 242, 253)');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 29, 51)');
  await mainNavigation(page).getByRole('link', { name: 'Roles & Permissions', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('every nested destination resolves with one active menu item', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await visitAuthenticated(page, '/administration');
  await expect(mainNavigation(page).getByRole('button', { name: 'Administration', exact: true })).toBeVisible();
  const destinations = await page.locator('.subnav a').evaluateAll((links) => links.map((link) => ({ path: link.getAttribute('href')!, label: link.textContent!.trim() })));
  expect(destinations.length).toBeGreaterThan(25);
  for (const destination of destinations) {
    await visitAuthenticated(page, destination.path);
    await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(mainNavigation(page).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(mainNavigation(page).getByRole('link', { name: destination.label, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  expect(errors).toEqual([]);
});

for (const theme of ['light', 'dark'] as const) {
  for (const width of theme === 'light' ? [320, 390, 768, 1024, 1672] : [390, 1672]) {
    test(`accessible reflow ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 941 });
      await visitAuthenticated(page, '/administration'); await loaded(page);
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await accessibility(page);
    });
  }
}

test('open drawer and header placeholders pass automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAuthenticated(page, '/administration'); await loaded(page);
  await page.getByRole('button', { name: 'Toggle navigation' }).click(); await accessibility(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Notifications', exact: true }).click(); await accessibility(page);
  await page.getByRole('button', { name: 'My Profile', exact: true }).click(); await accessibility(page);
});

test('shell visual regression at reference dimensions', async ({ page }) => {
  await visitAuthenticated(page, '/administration'); await loaded(page);
  const measurements = await page.evaluate(() => Object.fromEntries(
    Object.entries({ sidebar: '.sidebar', header: '.header', title: 'iam-page-header', kpi: '.kpi-grid', configuration: '.configuration', lowerPanels: '.overview-grid' }).map(([name, selector]) => {
      const element = document.querySelector(selector)!;
      const { x, y, width, height } = element.getBoundingClientRect();
      return [name, { x, y, width, height, background: getComputedStyle(element).backgroundColor }];
    }),
  ));
  await writeFile(test.info().outputPath('layout-measurements.json'), JSON.stringify(measurements, null, 2));
  await expect(page).toHaveScreenshot('administration-shell.png', { fullPage: true });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page).toHaveScreenshot('administration-collapsed.png', { fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page).toHaveScreenshot('administration-dark.png', { fullPage: true });
});

test('mobile visual regression', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAuthenticated(page, '/administration'); await loaded(page);
  await expect(page).toHaveScreenshot('administration-mobile.png', { fullPage: true });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page).toHaveScreenshot('administration-mobile-drawer.png');
});
