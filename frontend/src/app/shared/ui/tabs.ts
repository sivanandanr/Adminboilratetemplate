import { SmartForm } from './forms';
import type { DirtyFormTracker } from '../../core/feedback/dirty-forms.service';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, DestroyRef, contentChildren, effect, inject, input, output, signal } from '@angular/core';
export interface SmartTab { readonly id: string; readonly label: string; readonly disabled?: boolean; }
let nextTabs = 0;
@Component({ selector: 'smart-tabs', template: `<div role="tablist" class="smart-tablist" [attr.aria-label]="label()">@for (tab of tabs(); track tab.id; let index = $index) { <button type="button" role="tab" class="smart-tab" [id]="id + '-tab-' + tab.id" [attr.aria-controls]="id + '-panel'" [attr.aria-selected]="selected() === tab.id" [tabIndex]="selected() === tab.id ? 0 : -1" [disabled]="tab.disabled ?? false" (click)="choose(tab.id)" (keydown)="key($event, index)">{{ tab.label }}</button> }</div><div role="tabpanel" [id]="id + '-panel'" [attr.aria-labelledby]="id + '-tab-' + selected()" tabindex="0"><ng-content /></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartTabs {
 readonly form = input<DirtyFormTracker | SmartForm | null>(null);
 private readonly parentForm = inject(SmartForm,{optional:true,skipSelf:true});
 private readonly projectedForms = contentChildren(SmartForm,{descendants:true});
 private readonly destroyRef = inject(DestroyRef);
 private readonly injector=inject(Injector);
 private pending = false;
 readonly id = `smart-tabs-${++nextTabs}`; readonly tabs = input.required<readonly SmartTab[]>(); readonly label = input('Sections'); readonly active = input(''); readonly changed = output<string>(); readonly selected = signal(''); private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
 constructor() { effect(() => { const tabs = this.tabs(); const requested = this.active(); if (tabs.some(tab => tab.id === requested && !tab.disabled)) this.selected.set(requested); else if (!tabs.some(tab => tab.id === this.selected() && !tab.disabled)) this.selected.set(tabs.find(tab => !tab.disabled)?.id ?? ''); }); }
 choose(id: string, focus = false): void {
  if(this.pending || id === this.selected() || !this.tabs().some(tab=>tab.id===id && !tab.disabled)) return;
  const explicit=this.form() ?? this.parentForm;
  const forms=explicit ? [explicit] : this.projectedForms();
  const dirty=forms.find(form=>form.isDirty());
  if(!dirty){this.activate(id,focus);return;}
  this.pending=true;
  void dirty.requestLeave().then(allowed=>{
   if(this.destroyRef.destroyed)return;
   if(allowed)this.activate(id,false);
   if(!allowed || focus)afterNextRender(()=>{if(!this.destroyRef.destroyed)this.focusSelected();},{injector:this.injector});
  }).finally(()=>this.pending=false);
 }
 private activate(id:string,focus:boolean):void {if(!this.tabs().some(tab=>tab.id===id && !tab.disabled))return;this.selected.set(id);this.changed.emit(id);if(focus)this.focusSelected();}
 private focusSelected():void {const index=this.tabs().findIndex(tab=>tab.id===this.selected());this.element.nativeElement.querySelectorAll<HTMLButtonElement>('[role=tab]')[index]?.focus();}

 key(event: KeyboardEvent, index: number): void { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const tabs = this.tabs(); const direction = event.key === 'ArrowLeft' || event.key === 'End' ? -1 : 1; let next = event.key === 'Home' ? -1 : event.key === 'End' ? tabs.length : index; for(let count=0;count<tabs.length;count++) { next = (next + direction + tabs.length) % tabs.length; if (!tabs[next].disabled) { this.choose(tabs[next].id,true); return; } } }
}
