import { ChangeDetectionStrategy, Component, DestroyRef, contentChildren, inject, input, output, signal } from '@angular/core';
import { SmartModal } from './modal';
import { SmartForm } from './forms';
import type { DirtyFormTracker } from '../../core/feedback/dirty-forms.service';
import { IconName } from '../icon';
@Component({selector:'smart-drawer',imports:[SmartModal],template:`<smart-modal presentation="drawer" [priority]="-10" [title]="title()" [headerIcon]="icon()" [open]="open()" (closed)="requestClose()"><ng-content /><ng-content select="[drawerFooter], smart-action-toolbar[placement=form]" ngProjectAs="[modalFooter]" /></smart-modal>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartDrawer {
 readonly title=input.required<string>(); readonly open=input(false); readonly icon=input<IconName>('Info'); readonly closed=output<void>();
 readonly form=input<DirtyFormTracker|SmartForm|null>(null);
 private readonly projectedForms=contentChildren(SmartForm,{descendants:true});
 private readonly destroyRef=inject(DestroyRef); private readonly confirming=signal(false);
 requestClose():void {
  if(this.confirming()) return;
  const forms=this.form() ? [this.form()!] : this.projectedForms();
  const dirty=forms.filter(form=>form.isDirty());
  if(!dirty.length){this.closed.emit();return;}
  this.confirming.set(true);
  void dirty[0].requestLeave().then(allowed=>{if(allowed && !this.destroyRef.destroyed && this.open())this.closed.emit();}).finally(()=>this.confirming.set(false));
 }
}
