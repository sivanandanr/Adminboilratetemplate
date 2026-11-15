import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { GridCapabilities, GridColumn, GridPage, GridRequest } from '../../shared/grid/grid.models';

export const resources = ['access','employees','applications','accounts','entitlements','requests','approvals','workflows','policies','audit'] as const;
export type Resource = typeof resources[number];
export const recordStatuses = ['Active','Inactive','Pending','Approved','Rejected'] as const;
export type RecordStatus = typeof recordStatuses[number];
export interface AdminRecord { readonly id:string; readonly name:string; readonly owner:string; readonly category:string; readonly status:RecordStatus; readonly description:string; readonly updatedAt:string; }
export interface RecordPatch { readonly name:string; readonly owner:string; readonly category:string; readonly description:string; readonly status:RecordStatus; }
export interface RecordsProvider {
 readonly mock:boolean;
 search(resource:Resource,request:GridRequest):Observable<GridPage<AdminRecord>>;
 get(resource:Resource,id:string):Observable<AdminRecord>;
 save(resource:Resource,id:string|null,patch:RecordPatch):Observable<AdminRecord>;
 decide(id:string,decision:'Approved'|'Rejected',reason:string):Observable<AdminRecord>;
}
export const RECORDS_PROVIDER = new InjectionToken<RecordsProvider>('RECORDS_PROVIDER');
export const recordCapabilities:GridCapabilities = { search:true, maxPageSize:100, sortFields:['id','name','owner','category','status','updatedAt'], filters:{name:['contains','equals'],owner:['contains'],category:['equals','contains'],status:['equals','in'],updatedAt:['gte','lte']} };
export const recordColumns:readonly GridColumn<AdminRecord>[] = [
 {id:'id',header:'Record ID',kind:'text',value:row=>row.id,searchable:true,width:130,export:{allowed:true}},
 {id:'name',header:'Name',kind:'text',value:row=>row.name,searchable:true,width:240,export:{allowed:true}},
 {id:'owner',header:'Owner',kind:'text',value:row=>row.owner,searchable:true,width:160,export:{allowed:true}},
 {id:'category',header:'Category',kind:'text',value:row=>row.category,searchable:true,width:150,export:{allowed:true}},
 {id:'status',header:'Status',kind:'status',value:row=>row.status,width:120,options:recordStatuses.map(value=>({value,label:value})),statusTone:value=>value==='Active'||value==='Approved'?'success':value==='Rejected'?'danger':value==='Pending'?'warning':'neutral',export:{allowed:true}},
 {id:'updatedAt',header:'Updated on',kind:'date',value:row=>new Date(row.updatedAt),width:150,export:{allowed:true}},
];
export function decodeRecord(value:unknown):AdminRecord {
 if(!value || typeof value!=='object') throw new Error('Invalid record');
 const row=value as Record<string,unknown>;
 for(const key of ['id','name','owner','category','description','updatedAt'] as const) if(typeof row[key]!=='string'||row[key].length>4000) throw new Error('Invalid record field');
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(row['id'] as string)||!recordStatuses.includes(row['status'] as RecordStatus)||!Number.isFinite(Date.parse(row['updatedAt'] as string))) throw new Error('Invalid record values');
 return {id:row['id'] as string,name:row['name'] as string,owner:row['owner'] as string,category:row['category'] as string,description:row['description'] as string,status:row['status'] as RecordStatus,updatedAt:row['updatedAt'] as string};
}
