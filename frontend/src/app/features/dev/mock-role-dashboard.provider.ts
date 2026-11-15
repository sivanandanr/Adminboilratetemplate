import { Injectable } from '@angular/core';
import { map, timer } from 'rxjs';
import { DashboardData, DashboardProvider, DashboardRole, DashboardWidget } from '../../shared/dashboard/dashboard.models';

/** PHASE6_DEVELOPMENT_DASHBOARD_ONLY: synthetic values, never production health claims. */
@Injectable({providedIn:'root'})
export class MockRoleDashboardProvider implements DashboardProvider {
 load(role:DashboardRole){return timer(180).pipe(map(():DashboardData=>{
  const labels:Record<DashboardRole,readonly string[]>={employee:['My requests','My approvals','My access','Recent notifications'],manager:['Team members','Pending approvals','Team access requests','Access review tasks'],iam:['Total identities','Applications','Accounts','Pending provisioning','Provisioning failures','Orphan accounts','Workflow exceptions','Access reviews'],system:['Service health','Integration status','Scheduler status','System errors','Operational alerts']};
  const values:Record<DashboardRole,readonly string[]>={employee:['12','3','28','5'],manager:['24','8','17','4'],iam:['10,248','48','24,316','126','8','34','5','12'],system:['99.9%','12 / 13','14 running','3','7']};
  const permission=role==='employee'?'dashboard.view':role==='system'?'admin.configure':'admin.view';
  const paths:Record<DashboardRole,readonly string[]>={employee:['/requests','/approvals','/my-access','/notifications'],manager:['/identity','/approvals','/requests','/approvals'],iam:['/identity','/applications','/accounts','/provisioning/policies'],system:['/administration/health','/connectors','/administration/jobs','/reporting/logs']};
  const widgets:DashboardWidget[]=labels[role].map((label,index)=>({id:role+'-kpi-'+index,kind:'kpi',title:label,permissions:[permission],metric:{label,value:values[role][index],detail:'Synthetic snapshot',icon:index%2?'Layers':'Users',tone:index===4?'danger':'primary'},trend:{direction:index%2?'flat':'up',label:index%2?'No change in mock period':'+2 in mock period'},items:[]}));
  widgets.push(
   {id:'tasks',kind:'tasks',title:role==='employee'?'My pending work':'Pending tasks',permissions:[permission],items:[{id:'task1',label:'Review access request',detail:'Pending · due today',path:'/approvals/APP0001'},{id:'task2',label:'Review submitted requests',detail:'Pending · example work queue',path:'/requests'}]},
   {id:'actions',kind:'actions',title:'Quick actions',permissions:[permission],items:paths[role].map((path,index)=>({id:'action'+index,label:labels[role][index],detail:'Open workspace',path}))},
   {id:'activity',kind:'activity',title:'Recent activity',permissions:[permission],items:[{id:'activity1',label:'Access request submitted',detail:'Mock event · 10 November 2026, 09:00',path:'/requests'},{id:'activity2',label:'Application configuration reviewed',detail:'Mock event · 10 November 2026, 08:45',path:'/applications'}]},
   {id:'notifications',kind:'notifications',title:'Recent notifications',permissions:['dashboard.view'],items:[{id:'notice1',label:'Your work summary is ready',detail:'Synthetic notification summary',path:'/notifications'}]},
   {id:'chart',kind:'chart',title:'Request summary',permissions:[permission],items:[{id:'approved',label:'Approved',value:38,detail:'38 requests'},{id:'pending',label:'Pending',value:12,detail:'12 requests'},{id:'rejected',label:'Rejected',value:4,detail:'4 requests'}]},
   {id:'status',kind:'status',title:'Status summary',permissions:[permission],items:[{id:'status1',label:'Available',detail:'Demo service · simulated healthy'},{id:'status2',label:'Attention required',detail:'Demo integration · simulated retry pending'}]},
   {id:'risk',kind:'risk',title:'Risk summary',permissions:['admin.view'],items:[{id:'risk1',label:'High risk',detail:'3 synthetic exceptions',path:'/entitlements'},{id:'risk2',label:'Review due',detail:'4 synthetic review tasks',path:'/approvals'}]},
  );
  return {mock:true,refreshedAt:new Date().toISOString(),widgets};
 }));}
}
