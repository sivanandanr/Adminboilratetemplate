import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

test('shared toasts match the supplied two-card composition', async ({ page }) => {
  await visitAuthenticated(page, '/dev/feedback');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Exercise the real service with reference copy without changing a feature page.
  await page.evaluate(() => {
    interface ToastApi { dismissAll(): void; show(options: { title: string; message: string; tone: string; durationMs: number }): number; }
    const debug = (window as unknown as { ng: { getComponent(element: Element): { toasts: ToastApi } } }).ng;
    const toasts = debug.getComponent(document.querySelector('smart-toast-container')!).toasts;
    toasts.dismissAll();
    toasts.show({ title: 'Request approved', message: 'Payment Approver was added for Ana Lim.', tone: 'success', durationMs: 0 });
    toasts.show({ title: 'Provisioning failed', message: 'SAP Finance rejected the change: attribute is read-only.', tone: 'error', durationMs: 0 });
  });
  const outlet = page.locator('smart-toast-container aside');
  await expect(outlet.locator('smart-toast')).toHaveCount(2);
  await expect(outlet.getByRole('button')).toHaveCount(2);
  const metrics = await outlet.evaluate(element => {
    const close = element.querySelector('.toast-close')!;
    return { width: element.getBoundingClientRect().width, closeBorder: getComputedStyle(close).borderWidth, closeShadow: getComputedStyle(close).boxShadow };
  });
  expect(metrics).toEqual({ width: 380, closeBorder: '0px', closeShadow: 'none' });
  expect((await new AxeBuilder({ page }).include('smart-toast-container').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await expect(outlet).toHaveScreenshot('reference-toast-stack.png');
  await outlet.getByRole('button', { name: 'Dismiss Request approved' }).focus();
  await page.keyboard.press('Enter');
  await expect(outlet.locator('smart-toast')).toHaveCount(1);
});

test('shared destructive confirmation matches the supplied reason dialog', async ({ page }) => {
  await visitAuthenticated(page, '/dev/feedback');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    interface DialogApi { confirmWithReason(options: { kind: string; title: string; message: string; primaryLabel: string }): Promise<unknown>; }
    const debug = (window as unknown as { ng: { getComponent(element: Element): { dialogs: DialogApi } } }).ng;
    void debug.getComponent(document.querySelector('smart-dialog-host')!).dialogs.confirmWithReason({
      kind: 'delete', title: 'Delete this workflow?',
      message: '"Group Membership Request" stops being used for new requests. Running requests finish on their current version. A second person must approve the delete.', primaryLabel: 'Delete',
    });
  });
  const dialog = page.getByRole('dialog', { name: 'Delete this workflow?' });
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(dialog.getByText("Enter a reason. It's saved in the audit trail.")).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toHaveCount(0);
  const primary = dialog.getByRole('button', { name: 'Delete', exact: true });
  await expect(primary).toBeVisible();
  const appearance = await primary.evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
  expect(appearance).toEqual({ color: 'rgb(255, 255, 255)', background: 'rgb(217, 45, 32)' });
  expect(await dialog.evaluate(element => element.getBoundingClientRect().width)).toBe(460);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await expect(dialog).toHaveScreenshot('reference-delete-reason.png');
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
});
