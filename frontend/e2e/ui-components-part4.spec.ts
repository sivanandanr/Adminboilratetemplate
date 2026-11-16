import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

for(const width of [390,1672])for(const dark of [false,true]){
 test(`Part 4 shell and footer scroll ownership ${width} ${dark?'dark':'light'}`,async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width,height:941});await visitAuthenticated(page,'/dev/components');if(dark)await page.getByRole('button',{name:'Switch to dark theme'}).click();
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--iam-layer-mobile-navigation').trim())).toBe('47');
  const footer=page.locator('smart-app-footer');await expect(footer).toContainText(`SmartIAM. All rights reserved.`);await expect(footer).toContainText('Development');await expect(footer.getByRole('navigation',{name:'Legal and support'})).toContainText('Privacy');
  for(const selector of ['smart-app-footer','smart-route-progress','smart-offline-banner','smart-toast-container','smart-block-ui','iam-auth-dialogs','smart-background-tasks'])await expect(page.locator(selector)).toHaveCount(1);
  if(width>767){
   const before=await footer.boundingBox();await page.locator('#main-content').evaluate(element=>element.scrollTop=2000);await expect.poll(()=>page.locator('#main-content').evaluate(element=>element.scrollTop)).toBeGreaterThan(0);expect(await footer.boundingBox()).toEqual(before);expect(await page.evaluate(()=>document.scrollingElement!.scrollTop)).toBe(0);expect((await page.locator('header.header').boundingBox())!.y).toBe(0);
  }else{await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await expect(footer).toBeInViewport();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(footer).toHaveScreenshot(`footer-${width}-${dark?'dark':'light'}.png`);
  expect((await new AxeBuilder({page}).include('smart-app-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 });
 test(`Part 4 drawer layout and focus ${width} ${dark?'dark':'light'}`,async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width,height:941});await visitAuthenticated(page,'/dev/components');if(dark)await page.getByRole('button',{name:'Switch to dark theme'}).click();
  const trigger=page.getByRole('button',{name:'Open drawer',exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name:'Configuration details'});await expect(dialog).toBeVisible();const bounds=(await dialog.boundingBox())!;expect(Math.round(bounds.x+bounds.width)).toBe(width);expect(Math.round(bounds.height)).toBe(941);if(width===390)expect(Math.round(bounds.width)).toBe(390);
  await expect(dialog.locator('footer').getByRole('button',{name:'Close details',exact:true})).toBeVisible();
  await expect(dialog).toHaveScreenshot(`drawer-${width}-${dark?'dark':'light'}.png`);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await dialog.locator('.modal-body').evaluate(element=>{const filler=document.createElement('div');filler.style.height='1800px';filler.textContent='Long details fixture';element.append(filler);element.scrollTop=900;});
  expect((await dialog.locator('header').boundingBox())!.y).toBe(0);await page.keyboard.press('Tab');await expect(dialog.locator(':focus')).toHaveCount(1);await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
 });
}

test('Part 4 grid owns row/horizontal scrolling while the card pager stays pinned',async({page})=>{
 test.setTimeout(60000);await visitAuthenticated(page,'/dev/grid/client');await expect(page.getByRole('gridcell').first()).toBeVisible();const panel=page.locator('.grid-panel');const pager=panel.locator('smart-grid-pagination');const before=await pager.boundingBox();await panel.locator('.grid-content').evaluate(element=>element.scrollTop=element.scrollHeight);expect(await pager.boundingBox()).toEqual(before);
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('gridcell').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const viewport=page.locator('.ag-body-horizontal-scroll-viewport');await viewport.evaluate(element=>element.scrollLeft=150);expect(await page.locator('#main-content').evaluate(element=>element.scrollLeft)).toBe(0);
});

test('Part 4 toast stays in the top layer when a drawer opens without taking keyboard focus',async({page})=>{
 await visitAuthenticated(page,'/dev/components');await page.evaluate(()=>{const browser=window as Window & {ng:{getComponent(element:Element):{toasts:{show(options:{title:string;message:string;tone:string;durationMs:number}):unknown}}}};browser.ng.getComponent(document.querySelector('smart-toast-container')!).toasts.show({title:'Saved changes',message:'Your changes were saved successfully.',tone:'success',durationMs:0});});
 await expect(page.locator('smart-toast-container aside')).toHaveJSProperty('popover','manual');await page.getByRole('button',{name:'Open drawer',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('smart-toast-container aside')).toHaveAttribute('popover','manual');await expect.poll(()=>page.locator('smart-toast-container aside').evaluate(element=>element.matches(':popover-open'))).toBe(true);await expect(page.getByRole('dialog',{name:'Configuration details'}).locator(':focus')).toHaveCount(1);await expect(page).toHaveScreenshot('toast-over-drawer.png');
});


test('Part 4 shared form footer stays reachable while its fields scroll',async({page})=>{
 await visitAuthenticated(page,'/dev/components');await page.getByLabel('Display name',{exact:false}).focus();
 const footer=page.getByRole('group',{name:'Form actions',exact:true});const main=page.locator('#main-content');
 const bounds=(await footer.boundingBox())!, viewport=(await main.boundingBox())!;expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.y+viewport.height+1);expect(bounds.y).toBeGreaterThan(viewport.y);
 await page.getByRole('button',{name:'Save changes',exact:true}).click();await expect(page.getByText('This field is required.').first()).toBeVisible();
});
