import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

test('showcase composes the shared dialogs, confirmations and toast host',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');
 for(const selector of ['smart-toast-container','smart-block-ui','smart-background-tasks','smart-offline-banner','iam-auth-dialogs'])await expect(page.locator(selector)).toHaveCount(1);
 await page.getByRole('button',{name:'Delete with reason',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Delete this demo item?'});
 await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Delete',exact:true}).click();await expect(dialog.getByText(/Enter a reason/)).toBeVisible();
 await dialog.getByRole('textbox').fill('Reviewed demo item');await dialog.getByRole('button',{name:'Delete',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByText('Demo deletion confirmed with a reason.')).toBeVisible();
 await page.getByRole('button',{name:'Open modal',exact:true}).click();await expect(page.getByRole('dialog',{name:'Shared modal example'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open modal',exact:true})).toBeFocused();
 for(const tone of ['success','info','warning','error'])await page.getByRole('button',{name:`${tone} toast`,exact:true}).click();
 await expect(page.locator('smart-toast-container')).toContainText('Error example');expect(await page.locator('smart-toast-container .toast').count()).toBeLessThanOrEqual(3);
});

test('showcase exercises real HTTP feedback and local file checks',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Progress and tasks',exact:true}).click();
 await page.getByRole('button',{name:'Quick save',exact:true}).click();await expect(page.getByText('Demo response confirmed.')).toBeVisible();await expect(page.locator('smart-block-ui [role="dialog"]')).toHaveCount(0);
 await page.getByRole('button',{name:'Unknown duration save',exact:true}).click();await expect(page.getByRole('alertdialog',{name:'Saving your changes'})).toBeVisible();await expect(page.getByRole('alertdialog',{name:'Saving your changes'})).not.toBeVisible();
 await page.getByRole('button',{name:'Fail a save',exact:true}).click();await expect(page.getByText('Demo response failed; existing values are unchanged.')).toBeVisible();
 await page.locator('input[type=file]').setInputFiles({name:'sample.csv',mimeType:'text/csv',buffer:Buffer.from('id,name\n1,Example')});await page.getByRole('button',{name:'Read and check file',exact:true}).click();await expect(page.locator('smart-file-upload')).toContainText('Ready');
 await page.getByRole('button',{name:'Preview offline banner',exact:true}).click();await expect(page.locator('smart-offline-banner')).toContainText('Retry now');await page.getByRole('button',{name:'Restore connection preview',exact:true}).click();
});

test('showcase guards dirty section changes and contains its pager',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Forms and unsaved changes',exact:true}).click();
 await page.getByLabel('Request name',{exact:false}).fill('Unsaved example');await page.getByRole('tab',{name:'Tables and selection',exact:true}).click();
 const guard=page.getByRole('dialog',{name:'Discard your changes?'});await expect(guard).toBeVisible();await guard.getByRole('button',{name:'Keep editing',exact:true}).click();await expect(page.getByLabel('Request name',{exact:false})).toHaveValue('Unsaved example');
 await page.getByRole('tab',{name:'Tables and selection',exact:true}).click();await guard.getByRole('button',{name:'Discard',exact:true}).click();
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByRole('cell',{name:'Example member 6',exact:true})).toBeVisible();await page.locator('smart-grid-pagination select').selectOption('10');await expect(page.getByRole('cell',{name:'Example member 1',exact:true})).toBeVisible();
});

test('showcase drawer discards through the shared guard and background export downloads real rows',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Containers and status',exact:true}).click();await page.getByRole('button',{name:'Open demo drawer',exact:true}).click();
 const drawer=page.getByRole('dialog',{name:'Demo note',exact:true});await drawer.getByLabel('Demo note text',{exact:false}).fill('Unsaved note');await page.keyboard.press('Escape');const guard=page.getByRole('dialog',{name:'Discard your changes?'});await guard.getByRole('button',{name:'Discard',exact:true}).click();await expect(drawer).not.toBeVisible();
 await page.getByRole('tab',{name:'Progress and tasks',exact:true}).click();await page.getByRole('button',{name:'Start export',exact:true}).click();const task=page.getByRole('region',{name:'Export demo members',exact:true});await expect(task).toContainText('Completed');const download=page.waitForEvent('download');await task.getByRole('button',{name:'Download',exact:true}).click();expect((await download).suggestedFilename()).toBe('ui-patterns-demo.csv');
});

test('showcase draft validates and clears the shared dirty state after saving',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Forms and unsaved changes',exact:true}).click();await page.getByRole('button',{name:'Save demo draft',exact:true}).click();await expect(page.getByText('This field is required.').first()).toBeVisible();
 await page.getByLabel('Request name',{exact:false}).fill('Example request');await page.getByLabel('Requested role',{exact:false}).selectOption('reader');await page.getByLabel('Confirm request details',{exact:false}).check();await page.getByRole('button',{name:'Save demo draft',exact:true}).click();await expect(page.getByText('Demo draft saved in memory.',{exact:true})).toBeVisible();await expect(page.locator('iam-ui-patterns .unsaved-pill')).toHaveCount(0);
});

test('showcase is available from the component catalog',async({page})=>{
 await visitAuthenticated(page,'/dev/components');await page.getByRole('link',{name:'Open UI Patterns',exact:true}).click();await expect(page).toHaveURL(/\/ui-patterns$/);

});

for(const width of [390,1672])for(const dark of [false,true])test(`showcase accessible responsive patterns ${width} ${dark?'dark':'light'}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:941});await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-11-16T12:00:00Z'));await visitAuthenticated(page,'/ui-patterns');if(dark)await page.getByRole('button',{name:'Switch to dark theme'}).click();
 for(const [id,label] of [['feedback','Actions and feedback'],['progress','Progress and tasks'],['forms','Forms and unsaved changes'],['data','Tables and selection'],['advanced-grid','Advanced data grid'],['containers','Containers and status']]){
  await page.getByRole('tab',{name:label,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('iam-ui-patterns').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.setViewportSize({width,height:4000});
  if(id==='forms')await page.locator('smart-action-toolbar.form-footer').evaluate(element=>(element as HTMLElement).style.position='static');
  await expect(page.locator('iam-ui-patterns')).toHaveScreenshot(`patterns-${id}-${width}-${dark?'dark':'light'}.png`);await page.setViewportSize({width,height:941});
  if(id==='forms'){
   await page.getByRole('button',{name:'Save demo draft',exact:true}).click();expect((await new AxeBuilder({page}).include('iam-ui-patterns').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
   await page.setViewportSize({width,height:4000});await expect(page.locator('iam-ui-patterns')).toHaveScreenshot(`patterns-validation-${width}-${dark?'dark':'light'}.png`);await page.setViewportSize({width,height:941});
  }
 }
});

test('showcase denies readers',async({page})=>{await visitAuthenticated(page,'/ui-patterns','reader@example.test');await expect(page).toHaveURL(/\/access-denied/);await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'UI Patterns',exact:true})).toHaveCount(0);});

test('sidebar opens UI Patterns and marks it active',async({page})=>{
 await visitAuthenticated(page,'/administration');
 const navigation=page.getByRole('navigation',{name:'Main navigation'});
 const link=navigation.getByRole('link',{name:'UI Patterns',exact:true});
 await expect(link).toBeVisible();await link.click();await expect(page).toHaveURL(/\/ui-patterns$/);await expect(link).toHaveAttribute('aria-current','page');await expect(page.getByRole('heading',{name:'UI Patterns',exact:true})).toBeVisible();
});

test('searchable autocomplete filters, pages, selects with keyboard and removes chips',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Forms and unsaved changes',exact:true}).click();
 const single=page.getByRole('combobox',{name:'Search owner',exact:true});await single.fill('Alex');await expect(page.getByRole('option',{name:'Alex Morgan',exact:true})).toBeVisible();await single.press('ArrowDown');await single.press('Enter');await expect(single).toHaveValue('Alex Morgan');
 await page.getByRole('button',{name:'Clear Search owner',exact:true}).click();await single.fill('*');await expect(page.getByRole('listbox',{name:'Search owner suggestions',exact:true}).getByRole('option')).toHaveCount(5);await page.getByRole('button',{name:'Load more suggestions',exact:true}).click();await expect(page.getByRole('listbox',{name:'Search owner suggestions',exact:true}).getByRole('option')).toHaveCount(10);await single.press('Escape');
 const multiple=page.getByRole('combobox',{name:'Search multiple owners',exact:true});await multiple.fill('Amelia');await page.getByRole('option',{name:'Amelia Chen',exact:true}).click();await multiple.press('Escape');const remove=page.getByRole('button',{name:'Remove Amelia Chen',exact:true});await expect(remove).toBeVisible();await remove.click();await expect(remove).toHaveCount(0);
 await single.fill('zzzz');await expect(page.getByText('No results found.',{exact:true})).toBeVisible();await single.press('Escape');
});

test('validation stays inline, announces errors and clears them as fields are corrected',async({page})=>{
 await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Forms and unsaved changes',exact:true}).click();await expect(page.locator('iam-ui-patterns smart-field-error [role=alert]')).toHaveCount(0);await page.getByRole('button',{name:'Save demo draft',exact:true}).click();
 const field=page.locator('smart-textbox').filter({has:page.getByLabel('Request name',{exact:false})});await expect(field.locator('[role=alert]')).toContainText('This field is required.');await expect(field.locator('[role=alert] iam-icon')).toBeVisible();await page.getByLabel('Request name',{exact:false}).fill('ab');await expect(field.locator('[role=alert]')).toContainText('Enter at least 3 characters.');await page.getByLabel('Request name',{exact:false}).fill('Valid request');await expect(field.locator('[role=alert]')).toHaveCount(0);
 await page.setViewportSize({width:390,height:941});expect((await new AxeBuilder({page}).include('iam-ui-patterns').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
});
