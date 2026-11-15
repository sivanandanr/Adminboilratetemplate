import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { AUTH_CONFIG, apiPath } from '../../core/auth/auth.config';
import { ServerGridDataSource } from '../../shared/grid/grid-data-source';
import { AdminRecord, RecordPatch, RecordsProvider, Resource, decodeRecord, recordCapabilities } from './records.models';
import { GridRequest } from '../../shared/grid';

@Injectable({providedIn:'root'})
export class ApiRecordsProvider implements RecordsProvider {
 readonly mock=false;
 private readonly http=inject(HttpClient);
 private readonly config=inject(AUTH_CONFIG);
 private path(resource:Resource,id?:string):string {
   if(id && !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Invalid record identifier');
   return apiPath(this.config,'/administration/'+resource)+(id?'/'+id:'');
 }
 search(resource:Resource,request:GridRequest) { return new ServerGridDataSource<AdminRecord>(this.http,this.path(resource)+'/search',recordCapabilities,decodeRecord).load(request); }
 get(resource:Resource,id:string) { return this.http.get<unknown>(this.path(resource,id)).pipe(map(decodeRecord)); }
 save(resource:Resource,id:string|null,patch:RecordPatch) { return (id?this.http.put<unknown>(this.path(resource,id),patch):this.http.post<unknown>(this.path(resource),patch)).pipe(map(decodeRecord)); }
 decide(id:string,decision:'Approved'|'Rejected',reason:string) { return this.http.post<unknown>(this.path('approvals',id)+'/decision',{decision,reason}).pipe(map(decodeRecord)); }
}
