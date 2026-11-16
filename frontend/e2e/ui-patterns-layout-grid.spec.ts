import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { visitAuthenticated } from './auth-helpers';

for(const width of [390,768,1672])test(`footer stays visible with one page scroller at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:841});await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Forms and unsaved changes',exact:true}).click();
 const footer=page.locator('smart-app-footer'), main=page.locator('#main-content');const before=await footer.boundingBox();await expect(footer).toBeInViewport();
 await main.evaluate(element=>element.scrollTop=element.scrollHeight);await expect.poll(()=>main.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);expect(await footer.boundingBox()).toEqual(before);expect(await page.evaluate(()=>({y:window.scrollY,overflow:document.documentElement.scrollHeight>innerHeight,x:document.documentElement.scrollWidth>innerWidth}))).toEqual({y:0,overflow:false,x:false});
 const mainBounds=(await main.boundingBox())!;expect(mainBounds.y+mainBounds.height).toBeLessThanOrEqual(before!.y+1);
 await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();if(width<768){await expect(page.locator('.sidebar').getByRole('button',{name:'Close navigation',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(footer).toBeInViewport();}
 await expect(page).toHaveScreenshot(`fixed-footer-${width}.png`);
});

for(const width of [390,1672])test(`advanced grid shared behaviors and containment at ${width}`,async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width,height:941});await visitAuthenticated(page,'/ui-patterns');await page.getByRole('tab',{name:'Advanced data grid',exact:true}).click();const grid=page.locator('smart-data-grid');await expect(page.getByRole('gridcell',{name:'Employee 00001',exact:true})).toBeVisible();await expect(grid.locator('smart-grid-pagination')).toContainText('of 1000');
 await page.getByLabel('Search records',{exact:true}).fill('Employee 00042');await expect(page.getByRole('gridcell',{name:'Employee 00042',exact:true})).toBeVisible();await expect(grid.locator('smart-grid-pagination')).toContainText('of 1');await page.getByRole('button',{name:'Clear all filters',exact:true}).click();await expect(grid.locator('smart-grid-pagination')).toContainText('of 1000');
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByRole('gridcell',{name:'Employee 00011',exact:true})).toBeVisible();await page.getByRole('button',{name:'Actions for Employee 00011',exact:true}).click();await page.getByRole('menuitem',{name:'View details',exact:true}).click();await expect(page.getByRole('dialog',{name:'Example employee details',exact:true})).toContainText('Employee 00011');await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);await expect(page.locator('smart-app-footer')).toBeInViewport();
 expect((await new AxeBuilder({page}).include('iam-ui-patterns').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
});
