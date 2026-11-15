import { expect, Page } from '@playwright/test';

/** Test fixture credentials are deliberately public and work only in development. */
export async function loginIfRequired(page: Page, username = 'admin@example.test'): Promise<void> {
  await page.waitForURL((url) => url.pathname === '/login' || url.pathname !== '/');
  if (new URL(page.url()).pathname !== '/login') return;
  const dismiss = page.getByRole('button', { name: 'Back to Sign In', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.getByRole('textbox', { name: 'Username or email', exact: false }).fill(username);
  await page.locator('#password').fill('Demo-only!23');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Toggle navigation', exact: true })).toBeVisible();
}
export async function visitAuthenticated(page: Page, path: string, username = 'admin@example.test'): Promise<void> {
  await page.goto(path);
  // Wait for the client router to complete boot/guard resolution before deciding.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await loginIfRequired(page, username);
}
