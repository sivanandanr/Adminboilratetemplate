import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KpiCard, KpiMetric } from '../../shared/kpi-card';
import { IconName } from '../../shared/icon';
import { AuthFacade } from '../../core/auth/auth.facade';
import { SmartDataGridComponent, GridAction, GridDataSource } from '../../shared/grid';
import { AdminPageTemplate } from '../../shared/templates/admin-page';
import { AdminRecord, RECORDS_PROVIDER, Resource, recordCapabilities, recordColumns } from './records.models';

@Component({selector:'iam-record-list',imports:[AdminPageTemplate,KpiCard,SmartDataGridComponent,RouterLink],template:`
 <smart-admin-page [title]="title" [description]="description" [icon]="icon" [kind]="resource==='audit'?'audit':'listing'" [mock]="provider.mock" [state]="preview()" (retried)="preview.set('ready')">
 <div template-actions>@if(canCreate()){<a class="button button-primary" [routerLink]="base+'/new'">{{ resource==='requests'?'Request access':'Create '+singular }}</a>}@if(provider.mock){<label>Page preview<select class="smart-input" aria-label="Page preview state" [value]="preview()" (change)="preview.set($any($event.target).value)"><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></label>}</div>
 <section class="record-metrics" aria-label="Record summary"><div class="metric-grid">@for(metric of metrics();track metric.label){<iam-kpi-card [metric]="metric" [loading]="loading()" />}</div></section>
 <smart-data-grid [gridId]="'records-'+resource" [title]="title" [source]="source" [columns]="columns" [rowId]="rowId" [rowLabel]="rowLabel" [preferencesScope]="scope()" [rowActions]="actions" (rowAction)="open($event.row.id)" />
 </smart-admin-page>`,styles:`.record-metrics { margin-bottom:16px; }.metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }@media(max-width:1100px){.metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }}@media(max-width:600px){.metric-grid { grid-template-columns:minmax(0,1fr); }}label { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }select { width:110px; }`,changeDetection:ChangeDetectionStrategy.OnPush})
export class RecordList {
 readonly provider=inject(RECORDS_PROVIDER);
 private readonly auth=inject(AuthFacade);
 private readonly router=inject(Router);
 private readonly data=inject(ActivatedRoute).snapshot.data;
 readonly resource=this.data['resource'] as Resource;
 readonly title=this.data['label'] as string;
 readonly icon=this.data['icon'] as IconName;
 readonly base=this.data['base'] as string;
 readonly singular=this.data['singular'] as string;
 readonly description='Search, filter and inspect '+this.title.toLowerCase()+'. '+(this.provider.mock?'Synthetic examples; changes last only for this session.':'Authorized server records.');
 readonly preview=signal<'ready'|'loading'|'empty'|'error'>('ready');
 readonly columns=recordColumns;
 readonly source:GridDataSource<AdminRecord>={mode:'server',capabilities:recordCapabilities,load:request=>this.provider.search(this.resource,request)};
 readonly actions:readonly GridAction<AdminRecord>[]=[{id:'view',label:'View details'}];
 readonly rowId=(row:AdminRecord)=>row.id;
 readonly rowLabel=(row:AdminRecord)=>row.name;
 readonly scope=()=>this.auth.user()?.id??'anonymous';
 readonly grid=viewChild<SmartDataGridComponent<AdminRecord>>(SmartDataGridComponent);
 readonly loading=computed(()=>this.grid()?.state.loading()??false);
 readonly metrics=computed<readonly KpiMetric[]>(()=>{
  const controller=this.grid()?.state;
  const page=controller?.failure()?undefined:controller?.page();
  const unavailable='\u2014';
  return [
   {label:'Matching records',value:page?.totalCount==null?unavailable:String(page.totalCount),detail:'Current query total',icon:'Users',tone:'primary'},
   {label:'Active on page',value:page?String(page.items.filter(row=>row.status==='Active').length):unavailable,detail:'Loaded page only',icon:'CircleCheck',tone:'success'},
   {label:'Pending on page',value:page?String(page.items.filter(row=>row.status==='Pending').length):unavailable,detail:'Loaded page only',icon:'CalendarDays',tone:'warning'},
   {label:'Rows loaded',value:page?String(page.items.length):unavailable,detail:'Current page',icon:'Layers',tone:'info'},
  ];
 });
 canCreate():boolean{return !['audit','approvals','accounts','entitlements','access'].includes(this.resource)&&(this.resource==='requests'||this.auth.canAll(['admin.configure']));}
 open(id:string):void{void this.router.navigate([this.base,id]);}
}
