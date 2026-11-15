import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

for (const width of [390, 1672]) for (const dark of [false, true]) {
  test(`Part 1 dialog and toast surfaces ${width} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 941 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await visitAuthenticated(page, '/dev/feedback');
    if (dark) await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.getByRole('button', { name: 'Delete with reason', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog.locator('.reason-field .smart-errors')).toContainText('Enter a reason');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await expect(dialog).toHaveScreenshot(`reason-${width}-${dark ? 'dark' : 'light'}.png`);
    // Exercise actual layout overflow without adding an application/demo page.
    await dialog.locator('.modal-body').evaluate(body => {
      const content = document.createElement('p'); content.textContent = 'Long dialog content. '.repeat(1000); body.append(content);
    });
    const geometry = await dialog.evaluate(element => {
      const body = element.querySelector('.modal-body')!;
      const header = element.querySelector('header')!.getBoundingClientRect();
      const footer = element.querySelector('footer')!.getBoundingClientRect();
      body.scrollTop = body.scrollHeight;
      return { height: element.getBoundingClientRect().height, viewport: innerHeight, scrolls: body.scrollHeight > body.clientHeight, headerVisible: header.top >= 0, footerVisible: footer.bottom <= innerHeight };
    });
    expect(geometry.height).toBeLessThanOrEqual(geometry.viewport * .85 + 1);
    expect(geometry.scrolls && geometry.headerVisible && geometry.footerVisible).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete with reason', exact: true })).toBeFocused();
    for (const tone of ['success', 'info', 'warning', 'error']) await page.getByRole('button', { name: `${tone} toast`, exact: true }).click();
    await page.mouse.move(0, 940);
    await expect(page.locator('smart-toast')).toHaveCount(3);
    await expect(page.locator('smart-toast-container aside')).toHaveScreenshot(`toasts-${width}-${dark ? 'dark' : 'light'}.png`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
