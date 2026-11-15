import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

interface Tracker { markSaved(): void; isDirty(): boolean; }
interface TestWindow extends Window {
 ng: { getComponent(element: Element): { auth?: { dirtyForms: { track(control: unknown, destroyRef?: unknown): Tracker } }; form?: unknown; destroyRef?: unknown } };
 __part3Tracker?: Tracker;
}

test('Part 3 shared dirty guard preserves editing, confirms Discard and restores trigger focus',async({page})=>{
 await visitAuthenticated(page,'/workflows'); await expect(page.getByLabel('Name',{exact:false})).not.toHaveValue('');
 await page.evaluate(()=>{ const browser=window as TestWindow; const root=browser.ng.getComponent(document.querySelector('app-root')!); const record=browser.ng.getComponent(document.querySelector('iam-record-page')!); browser.__part3Tracker=root.auth!.dirtyForms.track(record.form,record.destroyRef); });
 await page.getByLabel('Name',{exact:false}).fill('Keep my unsaved edit'); const dashboard=page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Dashboard',exact:true}); await dashboard.click();
 const dialog=page.getByRole('dialog',{name:'Discard your changes?'}); await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button',{name:'Keep editing',exact:true})).toBeFocused();
 expect((await new AxeBuilder({page}).include('smart-dialog-host').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await dialog.getByRole('button',{name:'Keep editing',exact:true}).click(); await expect(page).toHaveURL(/workflows/); await expect(page.getByLabel('Name',{exact:false})).toHaveValue('Keep my unsaved edit'); await expect(dashboard).toBeFocused();
 await dashboard.click(); await dialog.getByRole('button',{name:'Discard',exact:true}).click(); await expect(page).toHaveURL(/dashboard/); expect(await page.evaluate(()=>(window as TestWindow).__part3Tracker!.isDirty())).toBe(false);
});

test('Part 3 wildcard browse, filtering, disabled options and keyboard chips use one list implementation',async({page})=>{
 await visitAuthenticated(page,'/dev/components'); const roles=page.getByRole('combobox',{name:'Assigned roles'}); await roles.fill('*'); const list=page.getByRole('listbox',{name:'Assigned roles suggestions'});
 await expect(list.getByRole('option')).toHaveCount(4); await expect(list.getByRole('option',{name:'Unavailable role'})).toHaveAttribute('aria-disabled','true');
 await roles.fill('Reader'); await expect(list.getByRole('option')).toHaveCount(1); await roles.press('ArrowDown'); await expect(roles).toHaveAttribute('aria-activedescendant',/option-0/); await roles.press('Enter');
 await expect(page.getByRole('button',{name:'Remove Reader',exact:true})).toBeVisible(); await roles.press('Escape'); await page.getByRole('button',{name:'Remove Reader',exact:true}).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('button',{name:'Remove Reader',exact:true})).toHaveCount(0);
});

test('Part 3 browser refresh warns only while registered form has unsaved changes',async({page})=>{
 await visitAuthenticated(page,'/workflows'); await expect(page.getByLabel('Name',{exact:false})).not.toHaveValue('');
 await page.evaluate(()=>{ const browser=window as TestWindow; const root=browser.ng.getComponent(document.querySelector('app-root')!); const record=browser.ng.getComponent(document.querySelector('iam-record-page')!); browser.__part3Tracker=root.auth!.dirtyForms.track(record.form,record.destroyRef); });
 await page.getByLabel('Name',{exact:false}).fill('Unsaved browser edit');
 const warning=page.waitForEvent('dialog'); await page.evaluate(()=>{setTimeout(()=>window.location.reload(),0);}); const dialog=await warning; expect(dialog.type()).toBe('beforeunload'); await dialog.dismiss(); await expect(page.getByLabel('Name',{exact:false})).toHaveValue('Unsaved browser edit');
 await page.evaluate(()=>(window as TestWindow).__part3Tracker!.markSaved()); let warned=false; page.on('dialog',async dialog=>{warned=true;await dialog.dismiss();}); await page.reload(); expect(warned).toBe(false);
});
