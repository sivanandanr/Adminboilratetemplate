import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SmartTextbox, SmartNumberInput, SmartDropdown, SmartMultiSelect, SmartCheckbox, SmartRadioGroup, SmartToggle, SmartDateRangePicker, SmartFileUpload, smartDateRangeValidator, SmartDateRange, SmartPassword, SmartTextarea, SmartDatePicker } from './index';

@Component({ imports:[ReactiveFormsModule, SmartTextbox, SmartNumberInput, SmartDropdown, SmartMultiSelect, SmartCheckbox, SmartRadioGroup, SmartToggle, SmartDateRangePicker, SmartFileUpload, SmartPassword, SmartTextarea, SmartDatePicker], template:`
 <smart-textbox label="Name" hint="Public name" [formControl]="name" [readonly]="readonly" [required]="true" />
 <smart-number-input label="Count" [formControl]="number" />
 <smart-dropdown label="Role" [formControl]="role" [options]="options" [readonly]="readonly" />
 <smart-multi-select label="Roles" [formControl]="roles" [options]="options" />
 <smart-checkbox label="Accepted" [formControl]="accepted" [readonly]="readonly" />
 <smart-radio-group label="Mode" [formControl]="role" [options]="options" [readonly]="readonly" />
 <smart-toggle label="Enabled" [formControl]="enabled" [confirmChange]="confirm" [readonly]="readonly" />
 <smart-date-range-picker label="Range" [formControl]="range" />
 <smart-file-upload label="Files" [formControl]="files" accept=".txt" [maxBytes]="10" />
 <smart-password label="Password" [formControl]="password" />
 <smart-textarea label="Description" [formControl]="description" />
 <smart-date-picker label="Date" [formControl]="date" />` })
class FormExample {
 readonly name = new FormControl('', {nonNullable:true,validators:Validators.required}); readonly number = new FormControl<number | null>(2); readonly role = new FormControl('a'); readonly roles = new FormControl<readonly string[]>([]); readonly accepted = new FormControl(false); readonly enabled = new FormControl(false); readonly range = new FormControl<SmartDateRange | null>(null,smartDateRangeValidator); readonly files = new FormControl<readonly File[]>([]); readonly password = new FormControl('secret'); readonly description = new FormControl(''); readonly date = new FormControl('');
 readonly options = [{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]; readonly = false; confirm = jasmine.createSpy('confirm').and.resolveTo(true);
}
describe('Smart form controls', () => {
 beforeEach(() => TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]}));
 function setup() { const fixture = TestBed.createComponent(FormExample); fixture.detectChanges(); return { fixture, model:fixture.componentInstance, host:fixture.nativeElement as HTMLElement }; }
 it('uses the shared wrapper for every control and keeps all disabled controls unavailable', async () => {
  const {fixture,model,host}=setup();
  const names=['textbox','textarea','password','number-input','dropdown','multi-select','checkbox','radio-group','toggle','date-picker','date-range-picker','file-upload'];
  for(const name of names) expect(host.querySelector(`smart-${name} smart-form-field`)).withContext(name).not.toBeNull();
  for(const control of [model.name,model.number,model.role,model.roles,model.accepted,model.enabled,model.range,model.files,model.password,model.description,model.date]) control.disable();
  await fixture.whenStable();
  for(const input of Array.from(host.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea'))) expect(input.disabled).withContext(input.outerHTML).toBeTrue();
 });
 it('integrates textbox model writes, edits, reset, touched and disabled without echoing changes', () => {
  const {fixture,model,host} = setup(); const input = host.querySelector<HTMLInputElement>('smart-textbox input')!; const changes = jasmine.createSpy(); model.name.valueChanges.subscribe(changes);
  model.name.setValue('Server'); fixture.detectChanges(); expect(input.value).toBe('Server'); expect(changes).toHaveBeenCalledTimes(1);
  input.value='Edited'; input.dispatchEvent(new Event('input')); input.dispatchEvent(new Event('blur')); fixture.detectChanges(); expect(model.name.value).toBe('Edited'); expect(model.name.touched).toBeTrue();
  model.name.disable(); fixture.detectChanges(); expect(input.disabled).toBeTrue(); model.name.reset(); fixture.detectChanges(); expect(input.value).toBe('');
 });
 it('connects required validation feedback and hint to the labelled input', () => {
  const {fixture,model,host} = setup(); model.name.markAsTouched(); fixture.detectChanges(); fixture.detectChanges(); const input=host.querySelector('smart-textbox input')!;
  expect(input.getAttribute('aria-invalid')).toBe('true'); expect(host.querySelector('smart-textbox [role=alert]')?.textContent).toContain('required');
  for(const id of input.getAttribute('aria-describedby')!.split(' ')) expect(host.querySelector(`[id="${id}"]`)).not.toBeNull();
 });
 it('blocks readonly mutations across text, choice and toggle controls', async () => {
  const {fixture,model,host}=setup(); model.readonly=true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); const input=host.querySelector<HTMLInputElement>('smart-textbox input')!; input.value='Attempt'; input.dispatchEvent(new Event('input')); host.querySelector<HTMLInputElement>('smart-checkbox input')!.click(); host.querySelector<HTMLButtonElement>('smart-toggle button')!.click(); await fixture.whenStable(); expect(model.name.value).toBe(''); expect(model.accepted.value).toBeFalse(); expect(model.enabled.value).toBeFalse(); expect(model.confirm).not.toHaveBeenCalled();
 });
 it('converts number clearing to null and preserves numeric values', () => {
  const {model,host}=setup(); const input=host.querySelector<HTMLInputElement>('smart-number-input input')!; input.value='3.5'; input.dispatchEvent(new Event('input')); expect(model.number.value).toBe(3.5); input.value=''; input.dispatchEvent(new Event('input')); expect(model.number.value).toBeNull();
 });
 it('allows Tab to leave readonly selects while preventing selection keys', () => {
  const {fixture,model,host}=setup(); model.readonly=true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); const select=host.querySelector('smart-dropdown select')!;
  const tab=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}); select.dispatchEvent(tab); expect(tab.defaultPrevented).toBeFalse();
  const arrow=new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}); select.dispatchEvent(arrow); expect(arrow.defaultPrevented).toBeTrue();
 });
 it('integrates dropdown, multiple selection and radios with typed values', () => {
  const {fixture,model,host}=setup(); const select=host.querySelector<HTMLSelectElement>('smart-dropdown select')!; select.value='b'; select.dispatchEvent(new Event('change')); expect(model.role.value).toBe('b');
  const multiple=fixture.debugElement.queryAll(node => node.componentInstance instanceof SmartMultiSelect)[0].componentInstance as SmartMultiSelect; multiple.change(['a','b']); expect(model.roles.value).toEqual(['a','b']);
  host.querySelectorAll<HTMLInputElement>('smart-radio-group input')[0].click(); expect(model.role.value).toBe('a');
 });
 it('confirms toggles before emitting and ignores rejected confirmations', async () => {
  const {fixture,model,host}=setup(); const button=host.querySelector<HTMLButtonElement>('smart-toggle button')!; model.confirm.and.resolveTo(false); button.click(); await fixture.whenStable(); expect(model.enabled.value).toBeFalse(); model.confirm.and.resolveTo(true); button.click(); await fixture.whenStable(); fixture.detectChanges(); expect(model.enabled.value).toBeTrue(); expect(button.getAttribute('aria-checked')).toBe('true');
 });
 it('does not apply a pending confirmation after a model reset or disable', async () => {
  const {fixture,model,host}=setup(); let resolve!:(value:boolean)=>void; model.confirm.and.returnValue(new Promise<boolean>(done=>resolve=done)); host.querySelector<HTMLButtonElement>('smart-toggle button')!.click(); model.enabled.disable(); fixture.detectChanges(); resolve(true); await fixture.whenStable(); expect(model.enabled.value).toBeFalse();
 });
 it('validates ranges including incomplete and reversed dates', () => {
  const {model,host}=setup(); const inputs=host.querySelectorAll<HTMLInputElement>('smart-date-range-picker input'); inputs[0].value='2026-11-20'; inputs[0].dispatchEvent(new Event('input')); expect(model.range.hasError('dateRange')).toBeTrue(); inputs[1].value='2026-11-19'; inputs[1].dispatchEvent(new Event('input')); expect(model.range.invalid).toBeTrue(); inputs[1].value='2026-11-21'; inputs[1].dispatchEvent(new Event('input')); expect(model.range.valid).toBeTrue();
 });
 it('rejects file type/size and accepts files without uploading', () => {
  const {fixture,model,host}=setup(); const input=host.querySelector<HTMLInputElement>('smart-file-upload input')!;
  function files(file:File) { Object.defineProperty(input,'files',{configurable:true,value:[file]}); input.dispatchEvent(new Event('change')); fixture.detectChanges(); }
  files(new File(['bad'],'test.exe')); expect(model.files.value).toEqual([]); expect(host.querySelector('smart-file-upload')!.textContent).toContain('Choose a supported file type');
  files(new File(['much too long a file'],'test.txt')); expect(model.files.value).toEqual([]);
  const file=new File(['ok'],'test.txt'); files(file); expect(model.files.value).toEqual([file]); host.querySelector<HTMLButtonElement>('smart-file-upload button')!.click(); expect(model.files.value).toEqual([]);
 });
 it('toggles password visibility without changing its form value', () => {
  const {fixture,model,host}=setup(); host.querySelector<HTMLButtonElement>('smart-password button')!.click(); fixture.detectChanges(); expect(host.querySelector<HTMLInputElement>('smart-password input')!.type).toBe('text'); expect(model.password.value).toBe('secret');
 });
 it('integrates textarea and native date changes', () => { const {model,host}=setup(); const area=host.querySelector('textarea')!; area.value='Description'; area.dispatchEvent(new Event('input')); expect(model.description.value).toBe('Description'); const date=host.querySelector<HTMLInputElement>('smart-date-picker input')!; date.value='2026-11-15'; date.dispatchEvent(new Event('input')); expect(model.date.value).toBe('2026-11-15'); });
});
