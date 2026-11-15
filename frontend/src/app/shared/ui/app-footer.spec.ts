import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartAppFooter, APP_METADATA } from './app-footer';
describe('Configured application footer',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideRouter([]),{provide:APP_METADATA,useValue:{product:'Example Admin',version:'2.1.3',environment:'Staging',links:[{label:'Privacy',href:'/privacy'},{label:'Terms',href:'https://example.test/terms'},{label:'Help',href:null},{label:'Unsafe',href:'javascript:alert(1)'}]}}]}));
 it('uses the current year and configured metadata and approved links, without fabricated destinations',()=>{
  const fixture=TestBed.createComponent(SmartAppFooter);fixture.detectChanges();const host=fixture.nativeElement as HTMLElement;expect(host.textContent).toContain(String(new Date().getFullYear()));expect(host.textContent).toContain('Example Admin');expect(host.textContent).toContain('v2.1.3');expect(host.textContent).toContain('Staging');expect(host.querySelectorAll('a').length).toBe(2);expect(host.querySelector('[aria-disabled=true]')?.textContent).toBe('Help');expect(host.querySelector('[href^="javascript:"]')).toBeNull();fixture.destroy();
 });
});
