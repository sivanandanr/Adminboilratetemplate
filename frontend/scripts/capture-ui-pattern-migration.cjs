const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
 const phase=process.argv[2]; if(!['before','after'].includes(phase))throw new Error('Use before or after');
 const output=path.join(__dirname,'../docs/design/ui-patterns-migration',phase);await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {for(const [name,url] of [['workflow','/workflows'],['employee-list','/identity'],['profile','/profile']]){
  const page=await browser.newPage({viewport:{width:1672,height:941}});await page.goto('http://127.0.0.1:4200'+url);await page.getByRole('heading',{level:1}).waitFor();
  if(page.url().includes('/login')){await page.getByRole('textbox',{name:'Username or email',exact:false}).fill('admin@example.test');await page.locator('#password').fill('Demo-only!23');await page.getByRole('button',{name:'Sign In',exact:true}).click();}
  await page.getByRole('button',{name:'Toggle navigation',exact:true}).waitFor();
  if(name==='workflow')await page.getByLabel('Name',{exact:false}).filter({visible:true}).waitFor();
  if(name==='employee-list')await page.getByRole('gridcell').first().waitFor();
  if(name==='profile')await page.getByLabel('Display name',{exact:false}).waitFor();
  await page.waitForTimeout(400);await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(0,0);await page.screenshot({path:path.join(output,name+'.png')});await page.close();
 }}finally{await browser.close();}
})();
