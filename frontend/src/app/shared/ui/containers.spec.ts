import { ModalScrollLock } from './modal';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SmartForm } from './forms';
import { SmartTextbox } from './textbox';
import { SmartDrawer } from './drawer';
import { SmartTabs } from './tabs';
import { SmartAccordion, SmartAccordionGroup } from './accordion';
import { SmartStatusBadge, SmartBadge, statusToneForRisk } from './display';
import { SmartBreadcrumb } from './breadcrumb';
import { SmartTable } from './table';
import { DirtyFormsService } from '../../core/feedback/dirty-forms.service';
import { DialogService } from '../../core/feedback/dialog.service';

@Component({imports:[SmartDrawer,SmartForm,SmartTextbox,ReactiveFormsModule],template:`<smart-drawer title="Edit details" [open]="open" (closed)="open=false"><form [formGroup]="form" smartForm><smart-textbox label="Name" formControlName="name" /></form><button drawerFooter>Save details</button></smart-drawer>`})
class DrawerExample {open=true;readonly form=new FormGroup({name:new FormControl('Original')});}
@Component({imports:[SmartAccordionGroup,SmartAccordion],template:`<smart-accordion-group [single]="single"><smart-accordion title="One" status="complete">First</smart-accordion><smart-accordion title="Two" status="needs-input">Second</smart-accordion></smart-accordion-group>`})
class AccordionsExample {single=true;}
@Component({imports:[SmartTable],template:`<smart-table label="Employees"><table><thead><tr><th scope="col">Name</th></tr></thead><tbody><tr><td>Sam</td></tr></tbody></table><button tablePager>Next records</button></smart-table>`})
class TableExample {}

describe('Part 4 shared containers',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideRouter([])]}));
 it('locks the desktop content scroller until the last overlapping modal releases it',()=>{
  const main=document.createElement('main');main.id='main-content';main.style.overflow='auto';document.body.append(main);
  const lock=TestBed.inject(ModalScrollLock);const first=lock.acquire();const second=lock.acquire();expect(main.style.overflow).toBe('hidden');first();expect(main.style.overflow).toBe('hidden');second();expect(main.style.overflow).toBe('auto');second();main.remove();
 });
 it('drawer uses the shared modal with its footer outside the scrolling body and protects projected forms',async()=>{
  const fixture=TestBed.createComponent(DrawerExample);fixture.detectChanges();await fixture.whenStable();const host=fixture.nativeElement as HTMLElement;
  const dialog=host.querySelector('dialog')!;expect(dialog.open).toBeTrue();expect(dialog.classList.contains('drawer')).toBeTrue();expect(host.querySelector('footer [drawerFooter]')?.textContent).toBe('Save details');expect(host.querySelector('.modal-body [drawerFooter]')).toBeNull();
  fixture.componentInstance.form.markAsDirty();dialog.dispatchEvent(new Event('cancel',{cancelable:true}));await fixture.whenStable();const dialogs=TestBed.inject(DialogService);expect(dialogs.requests().length).toBe(1);dialogs.settle(dialogs.requests()[0].id,{confirmed:false});await new Promise(resolve=>setTimeout(resolve,0));await fixture.whenStable();expect(fixture.componentInstance.open).toBeTrue();
  dialog.dispatchEvent(new Event('cancel',{cancelable:true}));dialogs.settle(dialogs.requests()[0].id,{confirmed:true});await new Promise(resolve=>setTimeout(resolve,0));await fixture.whenStable();expect(fixture.componentInstance.open).toBeFalse();expect(TestBed.inject(DirtyFormsService).isDirty()).toBeTrue();fixture.destroy();expect(TestBed.inject(DirtyFormsService).isDirty()).toBeFalse();
 });
 it('tabs confirm only their scoped form and do not emit a change when editing is retained',async()=>{
  const fixture=TestBed.createComponent(SmartTabs);fixture.componentRef.setInput('tabs',[{id:'a',label:'A'},{id:'b',label:'B'}]);fixture.detectChanges();
  const tracker=TestBed.inject(DirtyFormsService).track(new FormControl('value'));tracker.control.markAsDirty();const changed=jasmine.createSpy();fixture.componentInstance.changed.subscribe(changed);
  fixture.componentInstance.choose('b');expect(changed).toHaveBeenCalledWith('b'); // unrelated dirty forms do not block tabs
  fixture.componentRef.setInput('form',tracker);fixture.detectChanges();fixture.componentInstance.choose('a');fixture.componentInstance.choose('a');const dialogs=TestBed.inject(DialogService);expect(dialogs.requests().length).toBe(1);dialogs.settle(dialogs.requests()[0].id,{confirmed:false});await new Promise(resolve=>setTimeout(resolve,0));await fixture.whenStable();expect(fixture.componentInstance.selected()).toBe('b');expect(changed).toHaveBeenCalledTimes(1);
  fixture.componentInstance.choose('a');dialogs.settle(dialogs.requests()[0].id,{confirmed:true});await new Promise(resolve=>setTimeout(resolve,0));await fixture.whenStable();expect(fixture.componentInstance.selected()).toBe('a');expect(changed).toHaveBeenCalledTimes(2);
 });
 it('accordion groups optionally allow only one section and expose status text without relying on color',async()=>{
  const fixture=TestBed.createComponent(AccordionsExample);fixture.detectChanges();const host=fixture.nativeElement as HTMLElement;const details=host.querySelectorAll('details');
  details[0].open=true;details[0].dispatchEvent(new Event('toggle'));details[1].open=true;details[1].dispatchEvent(new Event('toggle'));expect(details[0].open).toBeFalse();expect(details[1].open).toBeTrue();expect(host.textContent).toContain('Complete');expect(host.textContent).toContain('Needs your input');
  fixture.componentInstance.single=false;fixture.changeDetectorRef.markForCheck();fixture.detectChanges();details[0].open=true;details[0].dispatchEvent(new Event('toggle'));expect(details[1].open).toBeTrue();
 });
 it('maps risks through the one semantic badge while retaining the legacy badge API',()=>{
  expect(['none','low','medium','high','critical'].map(risk=>statusToneForRisk(risk as 'none'|'low'|'medium'|'high'|'critical'))).toEqual(['mute','ok','warn','bad','bad']);
  const fixture=TestBed.createComponent(SmartStatusBadge);fixture.componentRef.setInput('risk','critical');fixture.componentRef.setInput('label','Critical risk');fixture.detectChanges();expect(fixture.nativeElement.querySelector('[data-tone=bad]').textContent).toContain('Critical risk');
  const old=TestBed.createComponent(SmartBadge);old.componentRef.setInput('tone','success');old.detectChanges();expect(old.nativeElement.querySelectorAll('smart-status-badge').length).toBe(1);expect(old.nativeElement.querySelector('[data-tone=ok]')).not.toBeNull();
 });
 it('breadcrumb links parents and renders the last item as current text even when a path is supplied',()=>{
  const fixture=TestBed.createComponent(SmartBreadcrumb);fixture.componentRef.setInput('items',[{label:'Administration',path:'/administration'},{label:'Employee',path:'/identity/1'}]);fixture.detectChanges();const host=fixture.nativeElement as HTMLElement;expect(host.querySelectorAll('a').length).toBe(1);expect(host.querySelector('a')?.getAttribute('href')).toBe('/administration');expect(host.querySelector('[aria-current=page]')?.textContent).toBe('Employee');
 });
 it('table keeps header and rows in its overflow region and the pager outside it',()=>{
  const fixture=TestBed.createComponent(TableExample);fixture.detectChanges();const host=fixture.nativeElement as HTMLElement;expect(host.querySelector('.table-scroll table thead')).not.toBeNull();expect(host.querySelector('footer [tablePager]')).not.toBeNull();expect(host.querySelector('.table-scroll [tablePager]')).toBeNull();expect(host.querySelector('.table-scroll')?.getAttribute('tabindex')).toBe('0');
 });
});
