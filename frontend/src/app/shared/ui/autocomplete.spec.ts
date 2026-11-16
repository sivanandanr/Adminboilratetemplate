import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, finalize } from 'rxjs';
import { SmartAutocomplete, SmartDataProvider, SmartOption, SmartSearchResult } from './autocomplete';
@Component({imports:[ReactiveFormsModule,SmartAutocomplete],template:`<smart-autocomplete label="User" [formControl]="value" [provider]="provider" [debounceMs]="0" [minLength]="2" [multiple]="multiple" />`})
class AutocompleteExample {
 readonly value=new FormControl<string | readonly string[] | null>(null); multiple=false;
 readonly requests: {query:string; source:Subject<SmartSearchResult<SmartOption>>; cancelled:boolean}[]=[];
 readonly provider:SmartDataProvider<SmartOption>={ search:request=>{ const entry={query:request.query,source:new Subject<SmartSearchResult<SmartOption>>(),cancelled:false}; this.requests.push(entry); return entry.source.pipe(finalize(()=>entry.cancelled=true)); } };
}
describe('SmartAutocomplete asynchronous and keyboard behavior',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]}));
 async function setup() { const fixture=TestBed.createComponent(AutocompleteExample); fixture.detectChanges(); await fixture.whenStable(); const input=(fixture.nativeElement as HTMLElement).querySelector('input')!; return {fixture,model:fixture.componentInstance,input,host:fixture.nativeElement as HTMLElement}; }
 async function search(input:HTMLInputElement,value:string) { input.value=value; input.dispatchEvent(new Event('input')); await new Promise(resolve=>setTimeout(resolve,15)); }
 it('keeps its search affordance decorative and its clear action labelled',async()=>{
  const {host,input}=await setup();expect(host.querySelector('.search-icon lucide-icon')?.getAttribute('aria-hidden')).toBe('true');expect(input.getAttribute('role')).toBe('combobox');expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Clear User');
 });
 it('honors minimum length and cancels stale requests so old responses cannot win',async()=>{
  const {fixture,model,input,host}=await setup(); await search(input,'a'); expect(model.requests.length).toBe(0); await search(input,'alpha'); expect(model.requests.length).toBe(1); await search(input,'beta'); expect(model.requests[0].cancelled).toBeTrue(); model.requests[0].source.next({items:[{value:'old',label:'Old'}]}); model.requests[1].source.next({items:[{value:'new',label:'New'}]}); fixture.detectChanges(); expect(host.textContent).not.toContain('Old'); expect(host.querySelector('[role=option]')?.textContent).toContain('New'); fixture.destroy(); expect(model.requests[1].cancelled).toBeTrue();
 });
 it('skips disabled options, selects with keyboard and exposes active descendant',async()=>{
  const {fixture,model,input}=await setup(); await search(input,'ab'); model.requests[0].source.next({items:[{value:'no',label:'Disabled',disabled:true},{value:'yes',label:'Enabled'}]}); fixture.detectChanges(); input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})); fixture.detectChanges(); expect(input.getAttribute('aria-activedescendant')).toContain('option-1'); input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); fixture.detectChanges(); expect(model.value.value).toBe('yes'); expect(input.getAttribute('aria-expanded')).toBe('false');
 });
 it('shows errors and retries, then clears selection without sending credentials',async()=>{
  const {fixture,model,input,host}=await setup(); await search(input,'ab'); model.requests[0].source.error(new Error('private backend details')); fixture.detectChanges(); expect(host.textContent).toContain('Unable to load'); expect(host.textContent).not.toContain('private backend'); Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='Retry search')!.click(); await new Promise(resolve=>setTimeout(resolve,15)); expect(model.requests.length).toBe(2); model.requests[1].source.next({items:[]}); fixture.detectChanges(); expect(host.textContent).toContain('No results'); host.querySelector('button')!.click(); expect(model.value.value).toBeNull();
 });
 it('supports multiple selection and bounds rendered records',async()=>{
  const {fixture,model,input,host}=await setup(); model.multiple=true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); await search(input,'ab'); model.requests[0].source.next({items:Array.from({length:500},(_,i)=>({value:String(i),label:`User ${i}`}))}); fixture.detectChanges(); expect(host.querySelectorAll('[role=option]').length).toBe(100); host.querySelector<HTMLElement>('[role=option]')!.click(); fixture.detectChanges(); expect(model.value.value).toEqual(['0']); host.querySelector<HTMLButtonElement>('[aria-label="Remove User 0"]')!.click(); expect(model.value.value).toEqual([]);
 });
 it('wildcard bypasses minimum length and maps browse-all to an empty provider query',async()=>{
  const {fixture,model,input}=await setup(); await search(input,'*'); expect(model.requests.length).toBe(1); expect(model.requests[0].query).toBe('');
  model.requests[0].source.next({items:[{value:'a',label:'Alpha'}]}); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Alpha');
 });

 it('does not submit the containing form when Enter has no active suggestion',async()=>{
  const {fixture,model,input}=await setup(); await search(input,'ab'); model.requests[0].source.next({items:[]}); fixture.detectChanges();
  const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}); input.dispatchEvent(event); expect(event.defaultPrevented).toBeTrue();
 });

});
