import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SmartTextbox, SmartDatePicker, SmartDateRangePicker, SmartPassword, SmartRadioGroup, SmartMultiSelect, SmartForm, SmartActionToolbar, SmartButton } from './index';
import { DialogService } from '../../core/feedback/dialog.service';
@Component({imports:[ReactiveFormsModule,SmartTextbox,SmartForm,SmartActionToolbar,SmartButton],template:`<form [formGroup]="form" smartForm #state="smartForm" (ngSubmit)="submitted=true"><smart-textbox label="Name" hint="Public display name" formControlName="name" [required]="true" disabledReason="You need edit permission." /><smart-action-toolbar [form]="state" (closed)="closed=true"><smart-button primaryAction label="Save" type="submit" variant="primary" /></smart-action-toolbar></form>`})
class FormExample { readonly form=new FormGroup({name:new FormControl('',[Validators.required,Validators.minLength(3)])}); submitted=false; closed=false; }
@Component({imports:[ReactiveFormsModule,SmartDatePicker,SmartDateRangePicker,SmartPassword],template:`<smart-date-picker label="Access start" [formControl]="date" [min]="min" max="2026-12-31" [accessDate]="true" /><smart-date-range-picker label="Range" [formControl]="range" min="2026-11-01" max="2026-12-31" /><smart-password label="Password" [formControl]="password" />`})
class DatesExample { readonly date=new FormControl<string|null>(null); readonly range=new FormControl({start:'2026-10-31',end:'2026-11-01'}); readonly password=new FormControl('server-secret'); min='2026-11-01'; }

describe('Shared form field policy',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]}));
 it('validates on submit, updates on change, and associates label/help/error and disabled reason',async()=>{
  const fixture=TestBed.createComponent(FormExample); fixture.detectChanges(); await fixture.whenStable(); const host=fixture.nativeElement as HTMLElement; const input=host.querySelector('input')!;
  input.dispatchEvent(new Event('blur')); fixture.detectChanges(); expect(host.querySelector('[role=alert]')).toBeNull();
  host.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})); await fixture.whenStable(); expect(input.getAttribute('aria-invalid')).toBe('true');
  const error=host.querySelector<HTMLElement>('[role=alert]')!;
  expect(error.querySelector('iam-icon')).not.toBeNull();
  expect(error.querySelector('span')?.textContent).toContain('This field is required.');
  expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
  input.value='ab'; input.dispatchEvent(new Event('input')); await fixture.whenStable(); expect(host.textContent).toContain('Enter at least 3 characters.');
  input.value='Valid'; input.dispatchEvent(new Event('input')); await fixture.whenStable(); expect(host.querySelector('[role=alert]')).toBeNull();
  fixture.componentInstance.form.reset(); await fixture.whenStable(); expect(host.querySelector('[role=alert]')).toBeNull();
  fixture.componentInstance.form.disable(); await fixture.whenStable(); expect(host.textContent).toContain('You need edit permission.');
  for(const id of input.getAttribute('aria-describedby')!.split(' ')) expect(host.querySelector(`[id="${id}"]`)).not.toBeNull();
 });
 it('binds dirty footer status and Close/Cancel to the form, and confirms Cancel before closing',async()=>{
  const fixture=TestBed.createComponent(FormExample); fixture.detectChanges(); await fixture.whenStable(); const host=fixture.nativeElement as HTMLElement;
  expect(host.textContent).toContain('Close'); fixture.componentInstance.form.markAsDirty(); await fixture.whenStable(); expect(host.textContent).toContain('Unsaved changes');
  const button=Array.from(host.querySelectorAll('button')).find(item=>item.textContent?.includes('Cancel'))!; button.click();
  const dialogs=TestBed.inject(DialogService); dialogs.settle(dialogs.requests()[0].id,{confirmed:false}); await fixture.whenStable(); expect(fixture.componentInstance.closed).toBeFalse();
  button.click(); dialogs.settle(dialogs.requests()[0].id,{confirmed:true}); await fixture.whenStable(); expect(fixture.componentInstance.closed).toBeTrue();
 });
 it('defaults only opted-in empty access dates, validates both bounds and never pre-fills a password',async()=>{
  const fixture=TestBed.createComponent(DatesExample); fixture.detectChanges(); await fixture.whenStable(); const model=fixture.componentInstance; const host=fixture.nativeElement as HTMLElement;
  const today=new Date(); expect(model.date.value).toBe(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`); expect(model.date.dirty).toBeFalse();
  expect(host.querySelector<HTMLInputElement>('smart-password input')!.value).toBe(''); model.password.setValue('replacement'); await fixture.whenStable(); expect(host.querySelector<HTMLInputElement>('smart-password input')!.value).toBe('');
  model.date.setValue('2026-10-31'); expect(model.date.hasError('minDate')).toBeTrue(); model.date.setValue('2027-01-01'); expect(model.date.hasError('maxDate')).toBeTrue(); model.date.setValue('2026-02-30'); expect(model.date.hasError('date')).toBeTrue();
  model.date.setValue('2026-12-01'); expect(model.date.valid).toBeTrue(); model.min='2026-12-02'; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); await fixture.whenStable(); expect(model.date.hasError('minDate')).toBeTrue();
  expect(model.range.hasError('minDate')).toBeTrue(); model.range.setValue({start:'2026-11-10',end:'2026-11-09'}); expect(model.range.hasError('dateRange')).toBeTrue();
 });
});
