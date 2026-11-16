import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DirtyFormsService } from './dirty-forms.service';
import { DirtyFormGuard } from './dirty-form.guard';
import { DialogService } from './dialog.service';
import { SmartForm } from '../../shared/ui/forms';

@Component({ imports: [ReactiveFormsModule, SmartForm], template: `<form [formGroup]="form" smartForm><input formControlName="name" /></form>` })
class EditForm { readonly form = new FormGroup({name: new FormControl('original')}); }
@Component({ template: `<p>Other page</p>` })
class OtherPage {}

describe('Dirty form lifecycle and route guard', () => {
 beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([{path:'edit', component:EditForm,canDeactivate:[DirtyFormGuard]}, {path:'other',component:OtherPage}])] }));
 it('adds beforeunload only while at least one form is dirty and cleans up destroyed forms', () => {
  const add = spyOn(window,'addEventListener').and.callThrough(); const remove = spyOn(window,'removeEventListener').and.callThrough();
  const registry = TestBed.inject(DirtyFormsService); const a = registry.track(new FormControl('a')); const b = registry.track(new FormControl('b'));
  expect(add.calls.allArgs().filter(args=>args[0]==='beforeunload').length).toBe(0);
  a.control.markAsDirty(); b.control.markAsDirty(); expect(registry.isDirty()).toBeTrue();
  expect(add.calls.allArgs().filter(args=>args[0]==='beforeunload').length).toBe(1);
  const event = new Event('beforeunload',{cancelable:true}); const listener = add.calls.allArgs().find(args=>args[0]==='beforeunload')![1] as EventListener; listener(event); expect(event.defaultPrevented).toBeTrue();
  a.markSaved(); expect(registry.isDirty()).toBeTrue(); b.destroy(); expect(registry.isDirty()).toBeFalse();
  expect(remove.calls.allArgs().filter(args=>args[0]==='beforeunload').length).toBe(1);
  a.destroy();
 });
 it('keeps failed saves and newer edits dirty, but clears successful unchanged saves and resets', async () => {
  const control = new FormControl('a'); const tracker = TestBed.inject(DirtyFormsService).track(control); control.markAsDirty();
  await expectAsync(tracker.save(()=>Promise.reject(new Error('failure')))).toBeRejected(); expect(tracker.isDirty()).toBeTrue();
  let finish!:()=>void; const saving = tracker.save(()=>new Promise<void>(resolve=>finish=resolve)); control.setValue('new edit'); finish(); await saving; expect(tracker.isDirty()).toBeTrue();
  expect(await tracker.save(()=>Promise.resolve(42))).toBe(42); expect(tracker.isDirty()).toBeFalse();
  control.markAsDirty(); control.reset(); expect(tracker.closeLabel()).toBe('Close');
 });
 it('uses one discard dialog and does not mark a form saved when discard is declined', async () => {
  const registry=TestBed.inject(DirtyFormsService); const tracker=registry.track(new FormControl('')); tracker.control.markAsDirty();
  const first=registry.requestLeave(); const second=registry.requestLeave(); const dialogs=TestBed.inject(DialogService);
  expect(dialogs.requests().length).toBe(1); expect(dialogs.requests()[0].options).toEqual(jasmine.objectContaining({title:'Discard your changes?',primaryLabel:'Discard',secondaryLabel:'Keep editing',okVariant:'danger'}));
  dialogs.settle(dialogs.requests()[0].id,{confirmed:false}); expect(await first).toBeFalse(); expect(await second).toBeFalse(); expect(tracker.isDirty()).toBeTrue();
 });
 it('blocks a real router navigation on Keep editing, permits Discard, and removes the listener on destruction', async () => {
  const harness=await RouterTestingHarness.create(); const edit=await harness.navigateByUrl('/edit',EditForm); edit.form.markAsDirty();
  const router=TestBed.inject(Router); const dialogs=TestBed.inject(DialogService); const first=router.navigateByUrl('/other');
  await new Promise(resolve=>setTimeout(resolve,0)); expect(dialogs.requests().length).toBe(1); dialogs.settle(dialogs.requests()[0].id,{confirmed:false}); expect(await first).toBeFalse(); expect(router.url).toBe('/edit');
  const second=router.navigateByUrl('/other'); await new Promise(resolve=>setTimeout(resolve,0)); dialogs.settle(dialogs.requests()[0].id,{confirmed:true}); expect(await second).toBeTrue(); expect(router.url).toBe('/other'); expect(TestBed.inject(DirtyFormsService).isDirty()).toBeFalse();
 });
 it('security cleanup removes warnings without saving or serializing form data', () => {
  const registry=TestBed.inject(DirtyFormsService); const control=new FormControl('private'); registry.track(control); control.markAsDirty(); registry.clear(); expect(registry.isDirty()).toBeFalse(); expect(control.value).toBe('private'); expect(control.dirty).toBeTrue();
 });
});
