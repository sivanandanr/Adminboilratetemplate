import { Routes } from '@angular/router';
import { UnsavedChangesGuard } from '../../shared/ui/wizard';
import { Permission } from '../../core/auth/auth.models';
import { PageTemplateKind } from '../../shared/templates/admin-page';
import { Resource } from './records.models';
import { IconName } from '../../shared/icon';

const modules:readonly {resource:Resource;base:string;label:string;singular:string;detail:PageTemplateKind;permission:Permission}[]=[
 {resource:'access',base:'my-access',label:'My Access',singular:'access assignment',detail:'details',permission:'dashboard.view'},
 {resource:'employees',base:'identity',label:'Employee Listing',singular:'employee',detail:'master-detail',permission:'admin.view'},
 {resource:'applications',base:'applications',label:'Application Listing',singular:'application',detail:'tabbed-details',permission:'admin.view'},
 {resource:'accounts',base:'accounts',label:'Account Listing',singular:'account',detail:'details',permission:'admin.view'},
 {resource:'entitlements',base:'entitlements',label:'Entitlement Listing',singular:'entitlement',detail:'details',permission:'admin.view'},
 {resource:'requests',base:'requests',label:'My Requests',singular:'request',detail:'details',permission:'dashboard.view'},
 {resource:'approvals',base:'approvals',label:'Approval Tasks',singular:'approval task',detail:'approval',permission:'dashboard.view'},
 {resource:'audit',base:'reporting/logs',label:'Audit Logs',singular:'audit event',detail:'details',permission:'admin.view'},
];
const page=()=>import('./record-page').then(module=>module.RecordPage);
export const recordsRoutes:Routes=modules.flatMap(module=>{
 const icons:Partial<Record<Resource,IconName>>={employees:'Users',applications:'Layers',accounts:'UserRound',entitlements:'Network',requests:'FileSearch',approvals:'ClipboardCheck',audit:'FileSearch',access:'KeyRound'};
 const data={label:module.label,icon:icons[module.resource]??'Layers',permissions:[module.permission],breadcrumbs:[{label:module.label,path:'/'+module.base}],resource:module.resource,base:'/'+module.base,singular:module.singular};
 const routes:Routes=[{path:module.base,title:module.label+' | SmartIAM',data,loadComponent:()=>import('./record-list').then(module=>module.RecordList)}];
 if(!['audit','approvals','accounts','entitlements','access'].includes(module.resource))routes.push({path:module.base+'/new',title:'Create '+module.singular+' | SmartIAM',data:{...data,label:module.resource==='requests'?'Request Access':'Create '+module.singular,template:module.resource==='requests'?'wizard':'create',breadcrumbs:[...data.breadcrumbs,{label:module.resource==='requests'?'Request Access':'Create '+module.singular}],permissions:[module.resource==='requests'?'dashboard.view':'admin.configure']},canDeactivate:[UnsavedChangesGuard],loadComponent:page});
 if(!['audit','approvals','requests','access'].includes(module.resource))routes.push({path:module.base+'/:id/edit',title:'Edit '+module.singular+' | SmartIAM',data:{...data,label:'Edit '+module.singular,template:'edit',breadcrumbs:[...data.breadcrumbs,{label:'Edit '+module.singular}],permissions:['admin.configure']},canDeactivate:[UnsavedChangesGuard],loadComponent:page});
 routes.push({path:module.base+'/:id',title:module.singular+' details | SmartIAM',data:{...data,label:module.singular==='employee'?'Employee Details':module.singular==='application'?'Application Details':module.singular+' details',template:module.detail,breadcrumbs:[...data.breadcrumbs,{label:module.singular+' details'}]},loadComponent:page});
 return routes;
});
for(const item of [{path:'workflows',resource:'workflows',label:'Workflow Configuration',id:'WOR0001'},{path:'provisioning/policies',resource:'policies',label:'Provisioning Policy Configuration',id:'POL0001'},{path:'administration/system',resource:'policies',label:'System Configuration',id:'POL0002'}] as const){recordsRoutes.push({path:item.path,title:item.label+' | SmartIAM',data:{label:item.label,icon:'Settings',resource:item.resource,recordId:item.id,singular:'configuration',base:'/'+item.path,template:'configuration',permissions:['admin.configure'],breadcrumbs:[{label:'Administration',path:'/administration'},{label:item.label}]},canDeactivate:[UnsavedChangesGuard],loadComponent:page});}
