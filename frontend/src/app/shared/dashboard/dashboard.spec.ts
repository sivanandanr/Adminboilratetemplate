import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of, Observable, Subscriber } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { Permission } from '../../core/auth/auth.models';
import { MockRoleDashboardProvider } from '../../features/dev/mock-role-dashboard.provider';
import { RoleDashboard } from '../../features/dashboard/role-dashboard';
import { decodeDashboard } from './api-dashboard.provider';
import { DASHBOARD_PROVIDER, DashboardData, DashboardWidget, widgetRegistry } from './dashboard.models';
import { DashboardWidgetComponent } from './dashboard-widget';

describe('Dashboard framework',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideRouter([])]}));
 const widget:DashboardWidget={id:'kpi',kind:'kpi',title:'Count',permissions:['dashboard.view'],metric:{label:'Count',value:'42',detail:'Example',tone:'primary',icon:'Users'},items:[]};
 it('renders widget loading/error/empty states and an actionable retry',()=>{
  const fixture=TestBed.createComponent(DashboardWidgetComponent);fixture.componentRef.setInput('widget',widget);fixture.componentRef.setInput('state','loading');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Loading Count');
  fixture.componentRef.setInput('state','error');fixture.detectChanges();const retry=jasmine.createSpy();fixture.componentInstance.retried.subscribe(retry);fixture.nativeElement.querySelector('button').click();expect(retry).toHaveBeenCalled();
  fixture.componentRef.setInput('state','empty');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('No data to display');
  fixture.componentRef.setInput('state','ready');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('42');
 });
 it('supplies all registered widget kinds across explicitly marked mock role snapshots',async()=>{
  const provider=TestBed.inject(MockRoleDashboardProvider);const data=await firstValueFrom(provider.load('iam'));
  expect(data.mock).toBeTrue();expect(data.widgets.filter(item=>item.kind==='kpi').length).toBe(8);
  expect(new Set(data.widgets.map(item=>item.kind))).toEqual(new Set(Object.keys(widgetRegistry)));
  expect((await firstValueFrom(provider.load('employee'))).widgets.some(item=>item.title==='My access')).toBeTrue();
 });
 it('validates API widgets, excludes arbitrary properties and rejects unsafe navigation and duplicate IDs',()=>{
  const value={refreshedAt:'2026-11-10T09:00:00Z',mock:true,widgets:[{...widget,secret:'PRIVATE'}]};const data=decodeDashboard(value);expect(data.mock).toBeFalse();expect('secret' in data.widgets[0]).toBeFalse();
  expect(()=>decodeDashboard({...value,widgets:[widget,widget]})).toThrow();
  expect(()=>decodeDashboard({...value,widgets:[{...widget,kind:'activity',items:[{id:'x',label:'X',detail:'Unsafe',path:'https://example.com'}]}]})).toThrow();
  expect(()=>decodeDashboard({...value,widgets:[{...widget,permissions:['unrecognized']}]})).toThrow();
 });
 it('hides inaccessible roles and widgets and reacts to permission changes',async()=>{
  const granted=signal<readonly Permission[]>(['dashboard.view']);
  TestBed.overrideProvider(AuthFacade,{useValue:{canAll:(required:readonly Permission[])=>required.every(item=>granted().includes(item))}});
  TestBed.overrideProvider(DASHBOARD_PROVIDER,{useValue:{load:()=>of({mock:true,refreshedAt:'2026-11-10T09:00:00Z',widgets:[widget,{...widget,id:'restricted',permissions:['admin.view']}]})}});
  const fixture=TestBed.createComponent(RoleDashboard);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();expect(fixture.componentInstance.roles().map(role=>role.id)).toEqual(['employee']);expect(fixture.componentInstance.widgets().length).toBe(1);
  granted.set(['dashboard.view','admin.view','admin.configure']);fixture.detectChanges();await fixture.whenStable();expect(fixture.componentInstance.roles().length).toBe(4);expect(fixture.componentInstance.widgets().length).toBe(2);
 });
 it('cancels obsolete role reads, renders empty/error states and tears down the active request',async()=>{
  const observers:Subscriber<DashboardData>[]=[];const cancelled=jasmine.createSpy();
  TestBed.overrideProvider(AuthFacade,{useValue:{canAll:()=>true}});
  TestBed.overrideProvider(DASHBOARD_PROVIDER,{useValue:{load:()=>new Observable<DashboardData>(observer=>{observers.push(observer);return cancelled;})}});
  const fixture=TestBed.createComponent(RoleDashboard);fixture.detectChanges();await fixture.whenStable();expect(fixture.componentInstance.state().status).toBe('loading');
  fixture.componentInstance.choose('iam');fixture.detectChanges();await fixture.whenStable();expect(cancelled).toHaveBeenCalledTimes(1);expect(observers[0].closed).toBeTrue();
  observers[1].next({mock:false,refreshedAt:'2026-11-10T09:00:00Z',widgets:[]});fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('No dashboard widgets');
  observers[1].error(new Error('PRIVATE_BACKEND_DETAIL'));fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Dashboard unavailable');expect(fixture.nativeElement.textContent).not.toContain('PRIVATE_BACKEND_DETAIL');
  fixture.componentInstance.refresh();fixture.detectChanges();await fixture.whenStable();expect(observers.length).toBe(3);fixture.destroy();expect(observers[2].closed).toBeTrue();
 });
});
