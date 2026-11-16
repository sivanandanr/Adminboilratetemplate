import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UiPatterns } from './ui-patterns';
import { UiPatternsDemoProvider } from './ui-patterns-demo.provider';
import { UiPatternsDemoInterceptor } from './ui-patterns-demo.interceptor';
import { DialogService, TaskService } from '../../shared/ui';
import { HttpClient } from '@angular/common/http';

describe('UI Patterns showcase composition',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideRouter([]),provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('uses shared components without creating duplicate global feedback hosts',async()=>{
  const fixture=TestBed.createComponent(UiPatterns);fixture.detectChanges();await fixture.whenStable();const host=fixture.nativeElement as HTMLElement;
  expect(host.querySelector('smart-tabs')).not.toBeNull();expect(host.querySelector('smart-button-group')).not.toBeNull();
  for(const selector of ['smart-toast-container','smart-dialog-host','smart-block-ui','smart-background-tasks','smart-offline-banner','iam-auth-dialogs'])expect(host.querySelector(selector)).withContext(selector).toBeNull();fixture.destroy();
 });
 it('returns required-reason outcomes from the shared dialog service',async()=>{
  const fixture=TestBed.createComponent(UiPatterns);fixture.detectChanges();const pending=fixture.componentInstance.confirm(true);const service=TestBed.inject(DialogService);expect(service.requests()[0].options.reason).toBe('required');service.settle(service.requests()[0].id,{confirmed:true,reason:'Reviewed'});await pending;expect(fixture.componentInstance.result()).toContain('with a reason');
 });
 it('calls only the isolated fixture endpoint and leaves values intact on failure',async()=>{
  const fixture=TestBed.createComponent(UiPatterns);fixture.detectChanges();fixture.componentInstance.form.controls.name.setValue('Retain this name');const pending=fixture.componentInstance.request('failure');const request=TestBed.inject(HttpTestingController).expectOne('/api/ui-patterns-demo/failure');request.flush({}, {status:500,statusText:'Failure'});await pending;expect(fixture.componentInstance.form.controls.name.value).toBe('Retain this name');expect(fixture.componentInstance.running()).toBeFalse();
 });
 it('keeps table paging bounded and resets the page when its size changes',()=>{
  const fixture=TestBed.createComponent(UiPatterns);fixture.detectChanges();fixture.componentInstance.tablePage.set(3);expect(fixture.componentInstance.rows[0].id).toBe(11);fixture.componentInstance.resizeTable(10);expect(fixture.componentInstance.tablePage()).toBe(1);expect(fixture.componentInstance.rows.length).toBe(10);
 });
});

describe('Isolated pattern work fixtures',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]}));
 it('reports confirmed local bytes, basic structure checks and readiness for a CSV',async()=>{
  const provider=TestBed.inject(UiPatternsDemoProvider);const file=new File(['id,name\n1,Example'],'sample.csv');const states:{status:string;loaded?:number;total?:number}[]=[];await provider.checkFile(file,state=>states.push(state));expect(states.some(state=>state.loaded===file.size&&state.total===file.size)).toBeTrue();expect(states.map(state=>state.status)).toContain('checking');expect(states.at(-1)?.status).toBe('ready');
 });
 it('returns actionable failure and cancellation without claiming a successful upload',async()=>{
  const provider=TestBed.inject(UiPatternsDemoProvider);const invalid=new File(['no records'],'invalid.csv');let status='';await provider.checkFile(invalid,state=>status=state.status);expect(status).toBe('failed');
  const file=new File(['id,name\n1,Example'],'cancel.csv');const pending=provider.checkFile(file,state=>{status=state.status;if(state.status==='uploading')provider.cancelFile(file);});await pending;expect(status).toBe('cancelled');
 });
 it('confirms cancellation through the shared task lifecycle',async()=>{
  const provider=TestBed.inject(UiPatternsDemoProvider), tasks=TestBed.inject(TaskService);const handle=provider.startTask(tasks,'import');const cancel=handle.cancel();const dialogs=TestBed.inject(DialogService);dialogs.settle(dialogs.requests()[0].id,{confirmed:true});await cancel;expect(tasks.items().find(item=>item.id===handle.id)?.status).toBe('cancelled');
 });
});

describe('UI fixture HTTP routing',()=>{
 it('handles only the development demo prefix and confirms quick writes',async()=>{
  TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideHttpClient(withInterceptors([UiPatternsDemoInterceptor]))]});const response=await firstValueFrom(TestBed.inject(HttpClient).post<{confirmed:boolean}>('/api/ui-patterns-demo/quick',{}));expect(response.confirmed).toBeTrue();
 });
});
