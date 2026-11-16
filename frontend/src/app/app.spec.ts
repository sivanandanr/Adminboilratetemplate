import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { authTestProviders } from './core/auth/auth-test.providers';
import { AuthFacade } from './core/auth/auth.facade';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([]), ...authTestProviders()]
    }).compileComponents();
    await TestBed.inject(AuthFacade).initialize();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('provides the application router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
  it('mounts one foreground progress dialog and one background task panel', () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('smart-block-ui').length).toBe(1); expect(host.querySelectorAll('smart-background-tasks').length).toBe(1);
    expect(host.querySelector('smart-route-progress')).toBeNull();
  });
});
