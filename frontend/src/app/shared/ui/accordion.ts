import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, input, output } from '@angular/core';
import { SmartStatusBadge } from './display';
let nextGroup=0;
@Component({selector:'smart-accordion-group',template:`<div role="group" [attr.aria-label]="label()"><ng-content /></div>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartAccordionGroup {
 readonly single=input(false);readonly label=input('Sections');readonly id=`accordion-group-${++nextGroup}`;
 private active:SmartAccordion|null=null;
 opened(item:SmartAccordion):void {if(this.single() && this.active && this.active!==item)this.active.collapse();this.active=item;}
}
@Component({selector:'smart-accordion',imports:[SmartStatusBadge],template:`<details #details class="panel" [open]="expanded()" [attr.name]="group?.single() ? group!.id : null" (toggle)="toggle()"><summary>{{title()}}@if(status()){<smart-status-badge [tone]="status()==='complete' ? 'ok' : 'warn'" [label]="status()==='complete' ? 'Complete' : 'Needs your input'" />}</summary><div><ng-content /></div></details>`,styles:`summary{cursor:pointer;padding:var(--iam-space-4);font-weight:600;}summary smart-status-badge{margin-left:var(--iam-space-2);}details>div{padding:0 var(--iam-space-4) var(--iam-space-4);}`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartAccordion {
 readonly title=input.required<string>();readonly expanded=input(false);readonly status=input<'complete'|'needs-input'|null>(null);readonly expandedChanged=output<boolean>();
 readonly group=inject(SmartAccordionGroup,{optional:true});
 @ViewChild('details')private details?:ElementRef<HTMLDetailsElement>;
 toggle():void {const open=this.details?.nativeElement.open ?? false;if(open)this.group?.opened(this);this.expandedChanged.emit(open);}
 collapse():void {if(this.details)this.details.nativeElement.open=false;}
}
