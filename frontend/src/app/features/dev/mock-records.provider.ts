import { Injectable } from '@angular/core';
import { defer, map, timer } from 'rxjs';
import { ApiError } from '../../core/auth/api-error';
import { ClientGridDataSource, GridRequest } from '../../shared/grid';
import { AdminRecord, RecordPatch, RecordsProvider, Resource, recordCapabilities, recordColumns } from '../records/records.models';

/** PHASE6_DEVELOPMENT_RECORDS_ONLY; memory-only fixtures excluded by environment replacement. */
@Injectable({providedIn:'root'})
export class MockRecordsProvider implements RecordsProvider {
 readonly mock=true;
 private readonly data=new Map<Resource,readonly AdminRecord[]>();
 private sequence=101;
 private rows(resource:Resource):readonly AdminRecord[] {
  let rows=this.data.get(resource);
  if(!rows){const labels:Record<Resource,string>={access:'My access',employees:'Employee',applications:'Application',accounts:'Account',entitlements:'Entitlement',requests:'Access request',approvals:'Approval task',workflows:'Workflow',policies:'Provisioning policy',audit:'Audit event'};rows=Array.from({length:100},(_,index)=>({id:resource.slice(0,3).toUpperCase()+String(index+1).padStart(4,'0'),name:labels[resource]+' '+String(index+1).padStart(3,'0'),owner:index%2?'Alex Morgan':'Sam Lee',category:resource==='audit'?'Administration':index%2?'Operations':'Technology',status:resource==='requests'||resource==='approvals'?'Pending':index%7===0?'Inactive':'Active',description:'Synthetic SmartIAM example. No connected system operation is performed.',updatedAt:'2026-11-10T09:00:00.000Z'}));this.data.set(resource,rows);}
  return rows;
 }
 search(resource:Resource,request:GridRequest){return defer(()=>timer(180).pipe(map(()=>new ClientGridDataSource(this.rows(resource),recordColumns,recordCapabilities).filteredRows(request)),map(rows=>({items:rows.slice((request.pageNumber-1)*request.pageSize,request.pageNumber*request.pageSize),totalCount:rows.length,pageNumber:request.pageNumber,pageSize:request.pageSize}))));}
 get(resource:Resource,id:string){return timer(120).pipe(map(()=>{const row=this.rows(resource).find(row=>row.id===id);if(!row)throw new ApiError(404,'server','Record unavailable');return row;}));}
 save(resource:Resource,id:string|null,patch:RecordPatch){return timer(200).pipe(map(()=>{if(['audit','approvals'].includes(resource))throw new ApiError(403,'forbidden','Operation unavailable');if(!patch.name.trim()||!patch.owner.trim())throw new ApiError(400,'validation','Invalid record');const rows=this.rows(resource);if(id&&!rows.some(row=>row.id===id))throw new ApiError(404,'server','Record unavailable');const row:AdminRecord={...patch,id:id??resource.slice(0,3).toUpperCase()+this.sequence++,updatedAt:new Date().toISOString()};this.data.set(resource,id?rows.map(item=>item.id===id?row:item):[row,...rows]);return row;}));}
 decide(id:string,decision:'Approved'|'Rejected',reason:string){return timer(200).pipe(map(()=>{const row=this.rows('approvals').find(row=>row.id===id);if(!row||row.status!=='Pending'||!reason.trim())throw new ApiError(409,'validation','Decision unavailable');const next={...row,status:decision,updatedAt:new Date().toISOString()};this.data.set('approvals',this.rows('approvals').map(item=>item.id===id?next:item));return next;}));}
}

