import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

test('component library is guarded and not accessible to reader fixtures', async ({page}) => {
 await visitAuthenticated(page,'/dev/components','reader@example.test'); await expect(page).toHaveURL(/access-denied/);
});
test('typed form controls validate, reset, select dates/files and honor readonly/disabled states', async ({page}) => {
 const errors:string[]=[]; page.on('pageerror',error=>errors.push(error.message)); await visitAuthenticated(page,'/dev/components');
 await page.getByRole('button',{name:'Save changes',exact:true}).click(); await expect(page.getByText('This field is required.').first()).toBeVisible();
 await page.getByLabel('Display name',{exact:false}).fill('Demo user'); await page.getByLabel('Password',{exact:false}).first().fill('Demo-password!');
 await page.getByRole('button',{name:'Show password',exact:true}).click(); await expect(page.locator('smart-password input')).toHaveAttribute('type','text');
 await page.getByLabel('Retry count').fill('8');
 await page.locator('smart-dropdown select').selectOption('reader'); const roles=page.getByRole('combobox',{name:'Assigned roles'}); await roles.fill('*'); await page.getByRole('listbox',{name:'Assigned roles suggestions'}).getByRole('option',{name:'Administrator',exact:true}).click(); await page.getByRole('listbox',{name:'Assigned roles suggestions'}).getByRole('option',{name:'Reader',exact:true}).click(); await roles.press('Escape');
 await page.getByLabel('Accept policy',{exact:false}).check(); await page.getByRole('radio',{name:'Application owner'}).check();
 await page.getByRole('switch',{name:'Configuration enabled',exact:false}).click(); await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','true');
 await page.getByLabel('Effective date',{exact:false}).fill('2026-11-15'); await page.getByLabel('Validity period start').fill('2026-11-15'); await page.getByLabel('Validity period end').fill('2026-11-16');
 await page.getByLabel('Attachments',{exact:false}).setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('notes')}); await expect(page.locator('smart-file-upload').getByText('notes.txt',{exact:true})).toBeVisible();await expect(page.locator('smart-file-upload')).toContainText('5 B');
 await page.getByRole('button',{name:'Save changes',exact:true}).click(); await expect(page.getByText('Demo values accepted locally; nothing was persisted.')).toBeVisible();
 await page.getByLabel('Demonstration state').selectOption('readonly'); await expect(page.locator('smart-textbox').first().locator('input')).toHaveAttribute('readonly',''); const state=await page.getByRole('switch').getAttribute('aria-checked'); await page.getByRole('switch').click(); await expect(page.getByRole('switch')).toHaveAttribute('aria-checked',state!);
 await page.getByLabel('Demonstration state').selectOption('disabled'); await expect(page.locator('smart-textbox').first().locator('input')).toBeDisabled();
 await page.getByLabel('Demonstration state').selectOption('default'); await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(page.locator('smart-textbox').first().locator('input')).toHaveValue(''); expect(errors).toEqual([]);
});
test('autocomplete supports local keyboard selection, remote cancellation/paging/error retry and multiple values', async ({page}) => {
 await visitAuthenticated(page,'/dev/components'); const local=page.getByRole('combobox',{name:'Local owner'}); await local.fill('read'); await page.getByRole('listbox',{name:'Local owner suggestions'}).getByRole('option',{name:'Reader',exact:true}).waitFor(); await local.press('ArrowDown'); await local.press('Enter'); await expect(local).toHaveValue('Reader');
 const remote=page.getByRole('combobox',{name:'Remote user'}); await remote.fill('slow'); await page.waitForTimeout(400); await remote.fill('fast'); await expect(page.getByRole('option',{name:'fast user 1',exact:true})).toBeVisible(); await page.waitForTimeout(1200); await expect(page.getByRole('option',{name:'slow user 1',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Load more suggestions'}).click(); await expect(page.getByRole('option',{name:'fast user 26',exact:true})).toBeVisible(); await remote.press('Escape');
 await page.getByRole('button',{name:'Simulate remote failure'}).click(); await remote.fill('error'); await expect(page.getByText('Unable to load suggestions.')).toBeVisible(); await page.getByRole('button',{name:'Retry search'}).click(); await expect(page.getByText('Unable to load suggestions.')).toBeVisible(); await remote.press('Escape'); await page.getByRole('button',{name:'Restore remote provider'}).click(); await remote.fill('restored'); await expect(page.getByRole('option',{name:'restored user 1',exact:true})).toBeVisible(); await remote.press('Escape');
 const multiple=page.getByRole('combobox',{name:'Multiple owners'}); await multiple.fill('read'); await page.getByRole('listbox',{name:'Multiple owners suggestions'}).getByRole('option',{name:'Reader',exact:true}).click(); await expect(page.getByRole('button',{name:'Remove Reader'})).toBeVisible(); await page.getByRole('button',{name:'Remove Reader'}).click(); await expect(page.getByRole('button',{name:'Remove Reader'})).toHaveCount(0);
});
test('tabs, accordion, tooltip, split actions, loading overlay and drawer support keyboard interaction', async ({page}) => {
 await visitAuthenticated(page,'/dev/components'); const details=page.getByRole('tab',{name:'Details',exact:true}); await details.focus(); await details.press('ArrowRight'); await expect(page.getByRole('tab',{name:'Permissions',exact:true})).toBeFocused(); await expect(page.getByRole('tabpanel')).toContainText('Effective permissions');
 await page.getByText('Keyboard-accessible accordion',{exact:true}).focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Native details/summary supports Enter and Space.')).toBeVisible();
 const tooltip=page.getByRole('button',{name:'Icon action',exact:true}); await tooltip.focus(); await expect(page.getByRole('tooltip')).toContainText('Configure'); await expect(tooltip).toHaveAttribute('aria-describedby', /smart-tooltip-/); await tooltip.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0);
 await page.getByRole('button',{name:'Create configuration more actions'}).click(); await page.getByRole('button',{name:'Create role',exact:true}).click(); await expect(page.getByRole('status').first()).toContainText('role');
 await page.getByRole('button',{name:'Toggle loading overlay'}).click(); await expect(page.locator('smart-loading-overlay').last().locator('[inert]')).toHaveCount(1);
 const trigger=page.getByRole('button',{name:'Open drawer'}); await trigger.click(); const dialog=page.getByRole('dialog',{name:'Configuration details'}); await expect(dialog).toBeVisible(); await expect(page.locator('body')).toHaveCSS('overflow','hidden'); await page.keyboard.press('Tab'); await expect(dialog.locator(':focus')).toHaveCount(1); await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});
for (const width of [390,1672]) for(const theme of ['light','dark']) {
 test(`component accessibility and reflow ${theme} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:941}); await visitAuthenticated(page,'/dev/components'); if(theme==='dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze(); expect(results.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); await page.getByRole('button',{name:'Open drawer'}).click(); expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 });
}
test('component form and action visual baselines',async({page})=>{
 // Capture complete controls without the real shell clipping the tall isolated component.
 await page.setViewportSize({width:1672,height:2600});
 await visitAuthenticated(page,'/dev/components'); await page.locator('.skip-link').evaluate(element => (element as HTMLElement).style.display = 'none'); await expect(page.locator('.skip-link')).toBeHidden(); await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }); await expect(page.locator('smart-form-section')).toHaveScreenshot('form-controls.png', { style: '.skip-link { visibility: hidden; } smart-action-toolbar.form-footer { position:static !important; }' }); await page.setViewportSize({width:1672,height:941}); await expect(page.locator('smart-card').filter({has:page.getByRole('heading',{name:'Buttons and action placement'})})).toHaveScreenshot('actions.png');
 await page.setViewportSize({width:390,height:4000}); await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }); await expect(page.locator('smart-form-section')).toHaveScreenshot('form-controls-mobile.png', { style: '.skip-link { visibility: hidden; } smart-action-toolbar.form-footer { position:static !important; }' });
});
