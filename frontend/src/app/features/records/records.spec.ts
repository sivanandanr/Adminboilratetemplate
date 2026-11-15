import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { MockRecordsProvider } from '../dev/mock-records.provider';
import { ApiRecordsProvider } from './api-records.provider';
import { decodeRecord, RecordPatch } from './records.models';
import { initialGridRequest } from '../../shared/grid';

describe('Administration record providers',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 const patch:RecordPatch={name:'New employee',owner:'Example owner',category:'Technology',description:'Synthetic record',status:'Active'};
 it('pages and filters the complete mock collection before slicing',async()=>{
  const provider=TestBed.inject(MockRecordsProvider);
  const page=await firstValueFrom(provider.search('employees',{...initialGridRequest,pageNumber:2,sorts:[{field:'name',direction:'desc'}]}));
  expect(page.totalCount).toBe(100);expect(page.items[0].name).toBe('Employee 090');expect(page.items.length).toBe(10);
  const filtered=await firstValueFrom(provider.search('employees',{...initialGridRequest,filters:[{field:'status',operator:'equals',value:'Inactive'}]}));expect(filtered.totalCount).toBe(15);
 });
 it('creates, edits and reads the same in-memory record without mutating another resource',async()=>{
  const provider=TestBed.inject(MockRecordsProvider);
  const created=await firstValueFrom(provider.save('employees',null,patch));
  const edited=await firstValueFrom(provider.save('employees',created.id,{...patch,name:'Updated employee'}));
  expect((await firstValueFrom(provider.get('employees',created.id))).name).toBe(edited.name);
  expect((await firstValueFrom(provider.search('applications',initialGridRequest))).totalCount).toBe(100);
  await expectAsync(firstValueFrom(provider.get('employees','missing'))).toBeRejected();
 });
 it('records a confirmed approval once and rejects stale decisions',async()=>{
  const provider=TestBed.inject(MockRecordsProvider);
  expect((await firstValueFrom(provider.decide('APP0001','Approved','Reviewed access'))).status).toBe('Approved');
  await expectAsync(firstValueFrom(provider.decide('APP0001','Rejected','Old snapshot'))).toBeRejected();
  await expectAsync(firstValueFrom(provider.save('audit',null,patch))).toBeRejected();
 });
 it('uses configured same-origin API paths, validates and projects unknown responses, and cancels obsolete reads',()=>{
  const provider=TestBed.inject(ApiRecordsProvider);const http=TestBed.inject(HttpTestingController);
  let name='';provider.get('employees','EMP0001').subscribe(row=>{name=row.name;expect('secret' in row).toBeFalse();});
  http.expectOne('/api/administration/employees/EMP0001').flush({...patch,id:'EMP0001',updatedAt:'2026-11-10T09:00:00Z',secret:'PRIVATE'});expect(name).toBe(patch.name);
  const subscription=provider.search('employees',initialGridRequest).subscribe();const request=http.expectOne('/api/administration/employees/search');expect(request.request.method).toBe('POST');expect(request.request.body).toEqual(initialGridRequest);subscription.unsubscribe();expect(request.cancelled).toBeTrue();
  expect(()=>provider.get('employees','../private')).toThrow();
 });
 it('rejects invalid status and timestamps rather than displaying untrusted fields',()=>{
  expect(()=>decodeRecord({...patch,id:'EMP0001',status:'<script>',updatedAt:'today'})).toThrow();
  expect(()=>decodeRecord({...patch,id:'EMP0001',updatedAt:'bad'})).toThrow();
 });
});
