import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SmartMultiSelect } from './multi-select';
@Component({imports:[ReactiveFormsModule,SmartMultiSelect],template:`<smart-multi-select label="Roles" [options]="options" [formControl]="value" [pageSize]="2" [readonly]="readonly" />`})
class Example { readonly value=new FormControl<readonly string[]>([]); readonly=false; readonly options=Array.from({length:5},(_,i)=>({value:String(i),label:`Role ${i}`,disabled:i===1})); }

describe('Searchable multi-select composition',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]}));
 it('pages wildcard results, searches within options, selects chips with the keyboard and removes them',async()=>{
  const fixture=TestBed.createComponent(Example); fixture.detectChanges(); await fixture.whenStable(); const host=fixture.nativeElement as HTMLElement; const input=host.querySelector('input')!;
  input.value='*'; input.dispatchEvent(new Event('input')); await fixture.whenStable(); expect(host.querySelectorAll('[role=option]').length).toBe(2);
  Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='Load more suggestions')!.click(); await fixture.whenStable(); expect(host.querySelectorAll('[role=option]').length).toBe(4);
  input.value='Role 4'; input.dispatchEvent(new Event('input')); await fixture.whenStable(); expect(host.querySelectorAll('[role=option]').length).toBe(1);
  input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})); await fixture.whenStable(); expect(input.getAttribute('aria-activedescendant')).toContain('option-0');
  input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); await fixture.whenStable(); expect(fixture.componentInstance.value.value).toEqual(['4']);
  host.querySelector<HTMLButtonElement>('[aria-label="Remove Role 4"]')!.click(); await fixture.whenStable(); expect(fixture.componentInstance.value.value).toEqual([]); expect(document.activeElement).toBe(input);
 });
 it('reflects model resets and locks selection, clearing and chip removal while readonly or disabled',async()=>{
  const fixture=TestBed.createComponent(Example); fixture.detectChanges(); fixture.componentInstance.value.setValue(['0']); await fixture.whenStable(); const host=fixture.nativeElement as HTMLElement;
  fixture.componentInstance.readonly=true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); await fixture.whenStable(); expect(host.querySelector<HTMLButtonElement>('[aria-label="Remove Role 0"]')!.disabled).toBeTrue();
  fixture.componentInstance.value.disable(); await fixture.whenStable(); expect(host.querySelector<HTMLInputElement>('input')!.disabled).toBeTrue();
  fixture.componentInstance.value.reset(); await fixture.whenStable(); expect(host.querySelector('.smart-chip')).toBeNull();
 });
});
