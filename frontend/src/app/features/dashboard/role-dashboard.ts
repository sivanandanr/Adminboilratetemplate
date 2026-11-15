import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { requiredForPath } from '../../core/auth/auth.models';
import { Button } from '../../shared/button';
import { PageHeader } from '../../shared/page-header';
import { FeedbackState } from '../../shared/feedback-state';
import { DASHBOARD_PROVIDER, DashboardData, DashboardRole, dashboardRoles, widgetRegistry } from '../../shared/dashboard/dashboard.models';
import { DashboardWidgetComponent } from '../../shared/dashboard/dashboard-widget';

type DashboardState = { status: 'loading' | 'error' | 'ready'; data?: DashboardData };
@Component({ selector:'iam-role-dashboard', imports:[DatePipe, Button, PageHeader, FeedbackState, DashboardWidgetComponent],
 template:`<iam-page-header title="Dashboard" description="Your work, access and operational overview." icon="LayoutDashboard"><button page-actions iamButton type="button" [disabled]="state().status === 'loading'" (click)="refresh()">Refresh dashboard</button></iam-page-header>
 <div class="dashboard-context"><label>Dashboard role<select class="smart-input" [value]="role()" (change)="choose($any($event.target).value)">@for(item of roles();track item.id){<option [value]="item.id">{{ item.label }}</option>}</select></label>@if(state().data; as data){<span role="status">{{ data.mock ? 'Mock data · ' : '' }}Last refreshed {{ data.refreshedAt | date:'mediumTime' }}</span>}</div>
 @if(state().status === 'loading'){<p role="status" aria-busy="true">Loading dashboard…</p>}
 @else if(state().status === 'error'){<iam-feedback-state kind="error" title="Dashboard unavailable" description="The dashboard service could not be reached." actionLabel="Retry dashboard" (retry)="refresh()" />}
 @else if(!widgets().length){<iam-feedback-state kind="empty" title="No dashboard widgets" description="No widgets are available for your current permissions." />}
 @else {<div class="widgets">@for(widget of kpis();track widget.id){<smart-dashboard-widget [widget]="widget" />}</div><div class="widgets support">@for(widget of support();track widget.id){<smart-dashboard-widget [widget]="widget" />}</div>}`,
 styles:`.dashboard-context { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }label { display:flex; align-items:center; gap:8px; }select { width:220px; }.widgets { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }.support { grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:16px; }@media(max-width:1100px){.widgets,.widgets.support { grid-template-columns:repeat(2,minmax(0,1fr)); }}@media(max-width:600px){.widgets,.widgets.support { grid-template-columns:minmax(0,1fr); }.wide { grid-column:auto; }.dashboard-context label { flex-wrap:wrap; }}`,
 changeDetection:ChangeDetectionStrategy.OnPush,
})
export class RoleDashboard {
 private readonly auth = inject(AuthFacade);
 private readonly provider = inject(DASHBOARD_PROVIDER);
 readonly roles = computed(() => dashboardRoles.filter(role => this.auth.canAll(role.permissions)));
 readonly role = signal<DashboardRole>('employee');
 private readonly revision = signal(0);
 private readonly request = computed(() => ({role: this.roles().some(item=>item.id===this.role()) ? this.role() : 'employee' as DashboardRole, revision:this.revision()}));
 readonly state = toSignal(toObservable(this.request).pipe(switchMap(request=>this.provider.load(request.role).pipe(map(data=>({status:'ready',data}) as DashboardState),startWith<DashboardState>({status:'loading'}),catchError(()=>of<DashboardState>({status:'error'}))))),{initialValue:{status:'loading'} as DashboardState});
 readonly widgets = computed(()=>(this.state().data?.widgets ?? []).filter(widget=>this.auth.canAll(widget.permissions)).map(widget=>({...widget,items:widget.items.filter(item=>!item.path||this.auth.canAll(requiredForPath(item.path)))})));
 readonly kpis=computed(()=>this.widgets().filter(widget=>widget.kind==='kpi'));
 readonly support=computed(()=>this.widgets().filter(widget=>widget.kind!=='kpi'));
 readonly registry = widgetRegistry;
 choose(value:string):void { if(this.roles().some(role=>role.id===value)) this.role.set(value as DashboardRole); }
 refresh():void { this.revision.update(value=>value+1); }
}
