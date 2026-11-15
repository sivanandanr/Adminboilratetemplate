import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { AUTH_CONFIG, apiPath } from '../../core/auth/auth.config';
import { permissions, safeReturnUrl } from '../../core/auth/auth.models';
import { DashboardData, DashboardProvider, DashboardRole, DashboardWidget, WidgetItem, widgetRegistry } from './dashboard.models';

function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid dashboard');return value as Record<string,unknown>;}
function text(value:unknown,max=400):string{if(typeof value!=='string'||value.length>max)throw new Error('Invalid dashboard text');return value;}
export function decodeDashboard(value:unknown):DashboardData {
 const data=object(value);
 const refreshedAt=text(data['refreshedAt']);
 if(!Number.isFinite(Date.parse(refreshedAt))||!Array.isArray(data['widgets'])||data['widgets'].length>40)throw new Error('Invalid dashboard snapshot');
 const ids=new Set<string>();
 const widgets:DashboardWidget[]=data['widgets'].map((raw:unknown)=>{
  const row=object(raw);const id=text(row['id'],100);const kind=text(row['kind']) as DashboardWidget['kind'];
  if(ids.has(id)||!Object.hasOwn(widgetRegistry,kind)||!Array.isArray(row['permissions'])||!row['permissions'].every(item=>permissions.includes(item))||!Array.isArray(row['items'])||row['items'].length>30)throw new Error('Invalid widget');ids.add(id);
  const items:WidgetItem[]=row['items'].map((rawItem:unknown)=>{const item=object(rawItem);const path=item['path']===undefined?undefined:text(item['path']);if(path&&safeReturnUrl(path)!==path)throw new Error('Invalid widget path');const count=item['value'];if(count!==undefined&&(typeof count!=='number'||!Number.isFinite(count)||count<0))throw new Error('Invalid chart value');return {id:text(item['id'],100),label:text(item['label']),detail:text(item['detail']),path,value:count as number|undefined};});
  let metric:DashboardWidget['metric'];
  if(kind==='kpi'){const rawMetric=object(row['metric']);const tone=text(rawMetric['tone']) as NonNullable<DashboardWidget['metric']>['tone'];if(!['primary','success','warning','danger','info'].includes(tone))throw new Error('Invalid KPI tone');metric={label:text(rawMetric['label']),value:text(rawMetric['value'],80),detail:text(rawMetric['detail']),tone,icon:'Activity'};}
  let trend:DashboardWidget['trend'];if(row['trend']!==undefined){const rawTrend=object(row['trend']);const direction=text(rawTrend['direction']) as 'up'|'down'|'flat';if(!['up','down','flat'].includes(direction))throw new Error('Invalid trend');trend={direction,label:text(rawTrend['label'])};}
  return {id,kind,title:text(row['title']),permissions:row['permissions'] as DashboardWidget['permissions'],items,metric,trend};
 });
 return {mock:false,refreshedAt,widgets};
}
@Injectable({providedIn:'root'})
export class ApiDashboardProvider implements DashboardProvider {
 private readonly http=inject(HttpClient);
 private readonly config=inject(AUTH_CONFIG);
 load(role:DashboardRole){return this.http.get<unknown>(apiPath(this.config,'/dashboards/'+role)).pipe(map(decodeDashboard));}
}
