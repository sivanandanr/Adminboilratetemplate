import { expect, Page, Route, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

interface BlockHandle { update(value: { percentage?: number | null; completedSteps?: number; text?: string }): void; end(): void; }
interface BlockApi { begin(options: { title: string; message?: string; steps?: string[] }): BlockHandle; }
interface TaskHandle { id: string; progress(done: number, total?: number, eta?: number): void; complete(result?: { message?: string; download?: () => Promise<{ filename: string; blob: Blob }> }): void; fail(message: string): void; }
interface TaskApi { start(options: { title: string; total?: number; unit?: string; run(handle: TaskHandle): void; cancel?: () => Promise<void>; retry?: (handle: TaskHandle) => void }): TaskHandle; }
interface HttpApi { post(url: string, body: unknown): { subscribe(options: { error(): void }): unknown }; get(url: string): { subscribe(options: { error(): void }): unknown }; }
interface DebugWindow extends Window {
    ng: { getComponent(element: Element): { blockUi?: BlockApi; tasks?: TaskApi; http?: HttpApi } };
    __part2Block?: BlockHandle[];
    __part2Tasks?: TaskHandle[];
}

async function startBlock(page: Page, kind: 'steps' | 'bytes' | 'unknown'): Promise<void> {
    await page.evaluate(kind => {
        const browser = window as DebugWindow, block = browser.ng.getComponent(document.querySelector('smart-block-ui')!).blockUi!;
        const handle = block.begin(kind === 'steps' ? { title: 'Saving your changes', message: 'Sending your changes to the server.', steps: ['Check the workflow', 'Save version 3.3', 'Keep running requests on 3.2'] } : kind === 'bytes' ? { title: 'Uploading evidence.pdf', message: 'Sending the file to the server.' } : { title: 'Loading access details', message: 'Getting the latest data from the server.' });
        if (kind === 'steps') handle.update({ completedSteps: 1, percentage: 56 });
        if (kind === 'bytes') handle.update({ percentage: 48, text: '4.8 of 10 MB' });
        browser.__part2Block = [handle];
    }, kind);
}

for (const width of [390, 1672]) for (const dark of [false, true]) {
    test(`Part 2 progress reference layouts ${width} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width, height: 941 }); await page.emulateMedia({ reducedMotion: 'reduce' });
        await visitAuthenticated(page, '/dev/feedback'); if (dark) await page.getByRole('button', { name: 'Switch to dark theme' }).click();
        for (const kind of ['steps', 'bytes', 'unknown'] as const) {
            await startBlock(page, kind);
            const dialog = page.getByRole('alertdialog'); await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button')).toHaveCount(0);
            if (kind === 'unknown') await expect(dialog.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
            else await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', kind === 'steps' ? '56' : '48');
            await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
            for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); await expect(dialog.locator(':focus')).toHaveCount(0); await expect(dialog).toBeFocused(); }
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
            await expect(dialog).toHaveScreenshot(`progress-${kind}-${width}-${dark ? 'dark' : 'light'}.png`);
            await page.evaluate(() => (window as DebugWindow).__part2Block?.forEach(handle => handle.end())); await expect(dialog).not.toBeVisible();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
}

test('automatic HTTP writes share one dialog, reads use the thin bar, errors release it', async ({ page }) => {
    await visitAuthenticated(page, '/dev/grid/server'); await expect(page.getByRole('gridcell').first()).toBeVisible();
    const writes: Route[] = []; await page.route('**/api/part2-write*', route => { writes.push(route); });
    await page.evaluate(() => { const browser = window as DebugWindow, http = browser.ng.getComponent(document.querySelector('iam-grid-showcase')!).http!; http.post('/api/part2-write-one', {}).subscribe({ error: () => undefined }); http.post('/api/part2-write-two', {}).subscribe({ error: () => undefined }); });
    const dialog = page.getByRole('alertdialog'); await expect(dialog).toBeVisible(); await expect(dialog).toHaveCount(1); expect(writes.length).toBe(2);
    await writes[0].fulfill({ json: {} }); await expect(dialog).toBeVisible(); await writes[1].fulfill({ status: 500, json: { message: 'PRIVATE_INTERNAL_ERROR' } }); await expect(dialog).not.toBeVisible(); await expect(page.locator('smart-toast')).toContainText('Service unavailable'); await expect(page.locator('body')).not.toContainText('PRIVATE_INTERNAL_ERROR');
    let read: Route | undefined; await page.route('**/api/part2-read', route => { read = route; });
    await page.evaluate(() => { const browser = window as DebugWindow; browser.ng.getComponent(document.querySelector('iam-grid-showcase')!).http!.get('/api/part2-read').subscribe({ error: () => undefined }); });
    await expect(page.locator('smart-route-progress [role=progressbar]')).toBeVisible(); await expect(dialog).not.toBeVisible(); await read!.fulfill({ json: {} }); await expect(page.locator('smart-route-progress [role=progressbar]')).toHaveCount(0);
});

test('foreground progress preempts an open modal and returns to it after completion', async ({ page }) => {
    await visitAuthenticated(page, '/dev/feedback'); await page.getByRole('button', { name: 'Open modal', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Reusable modal' }); await expect(form).toBeVisible(); await startBlock(page, 'unknown'); await expect(page.getByRole('alertdialog')).toBeVisible(); await expect(form).not.toBeVisible();
    await page.evaluate(() => (window as DebugWindow).__part2Block?.[0].end()); await expect(page.getByRole('alertdialog')).not.toBeVisible(); await expect(form).toBeVisible();
});

for (const width of [390, 1672]) for (const dark of [false, true]) {
    test(`Part 2 background tasks persist and expose safe actions ${width} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 941 }); await visitAuthenticated(page, '/dev/feedback'); if (dark) await page.getByRole('button', { name: 'Switch to dark theme' }).click();
        await page.evaluate(() => {
            const browser = window as DebugWindow, tasks = browser.ng.getComponent(document.querySelector('smart-background-tasks')!).tasks!;
            browser.__part2Tasks = [
                tasks.start({ title: 'Exporting 12 workflows', total: 12, unit: 'workflows', run: handle => handle.progress(7, 12, 3), cancel: async () => undefined }),
                tasks.start({ title: 'Importing members.csv', total: 10000, unit: 'rows', run: handle => handle.progress(3144, 10000, 9), cancel: async () => undefined }),
                tasks.start({ title: 'Discovery: SAP Finance', total: 412, unit: 'accounts', run: handle => handle.progress(164, 412, 6), cancel: async () => undefined, retry: handle => handle.complete({ message: 'Discovery completed.' }) }),
            ];
        });
        const panel = page.locator('smart-background-tasks aside'); await expect(panel).toContainText('Background tasks (3 running)'); await expect(panel.getByRole('button', { name: 'Clear finished tasks' })).toHaveCount(0);
        await expect(panel).toHaveScreenshot(`tasks-running-${width}-${dark ? 'dark' : 'light'}.png`);
        await panel.getByRole('button', { name: 'Cancel', exact: true }).nth(1).click(); const confirmation = page.getByRole('dialog', { name: 'Cancel this task?' }); await confirmation.getByRole('button', { name: 'Keep running', exact: true }).click(); await expect(panel).toContainText('3 running'); await expect(panel.getByRole('button', { name: 'Cancel', exact: true }).nth(1)).toBeFocused();
        await panel.getByRole('button', { name: 'Cancel', exact: true }).nth(1).click(); await confirmation.getByRole('button', { name: 'Cancel task', exact: true }).click(); await expect(panel).toContainText('Cancelled'); await expect(panel.getByRole('heading', { name: 'Importing members.csv' })).toBeFocused();
        await page.evaluate(() => { const handles = (window as DebugWindow).__part2Tasks!; handles[0].complete({ message: 'Ready to download.', download: async () => ({ filename: 'workflows.csv', blob: new Blob(['workflow\r\nExample']) }) }); handles[2].fail('Discovery failed. Retry to check the result.'); });
        await expect(panel.getByRole('button', { name: 'Download', exact: true })).toBeVisible(); await expect(panel.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
        expect((await new AxeBuilder({ page }).include('smart-background-tasks').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations).toEqual([]);
        await expect(panel).toHaveScreenshot(`tasks-finished-${width}-${dark ? 'dark' : 'light'}.png`);
        const download = page.waitForEvent('download'); await panel.getByRole('button', { name: 'Download', exact: true }).click(); expect((await download).suggestedFilename()).toBe('workflows.csv');
        await panel.getByRole('button', { name: 'Retry', exact: true }).click(); await expect(panel).toContainText('Discovery completed.');
        if (width === 390) await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
        await page.locator('.sidebar a[href="/administration"]').first().click(); await expect(panel).toContainText('Exporting 12 workflows');
        await panel.getByRole('button', { name: 'Minimize background tasks' }).click(); await expect(panel.locator('.rows')).toBeHidden(); await panel.getByRole('button', { name: 'Expand background tasks' }).click(); await panel.getByRole('button', { name: 'Clear finished tasks' }).click(); await expect(panel).toHaveCount(0);
    });
}

test('offline banner preserves the page, counts down and recovers with Retry now', async ({ page, context }) => {
    await visitAuthenticated(page, '/dev/grid/server'); await expect(page.getByRole('gridcell').first()).toBeVisible();
    await context.setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    const banner = page.getByRole('complementary', { name: 'Connection unavailable' }); await expect(banner).toContainText("Can't reach the server. Your work on this page is safe, but changes can't be saved yet."); await expect(page.getByRole('gridcell').first()).toBeVisible();
    await banner.getByRole('button', { name: 'Retry now' }).click(); await expect(banner.getByRole('button', { name: 'Retry now' })).toBeEnabled();
    await context.setOffline(false); await expect(banner).not.toBeVisible();
});

test('file upload retains selection-only behavior and exposes size/type limits', async ({ page }) => {
    await visitAuthenticated(page, '/dev/components'); const upload = page.locator('smart-file-upload'); await upload.locator('input').setInputFiles({ name: 'members.csv', mimeType: 'text/csv', buffer: Buffer.from('user\r\nexample') });
    await expect(upload).toContainText('members.csv'); await expect(upload).toContainText('Allowed types: .csv,.txt'); await expect(upload).toContainText('Maximum 1 KB'); await expect(upload.getByRole('progressbar')).toHaveCount(0);
});
