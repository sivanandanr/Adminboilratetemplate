import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';
import { FeedbackState } from './feedback-state';
import { KpiCard, KpiMetric } from './kpi-card';

@Component({ imports: [Button], template: '<button iamButton [loading]="busy" (click)="count = count + 1">Refresh</button>' })
class ButtonExample { busy = true; count = 0; }

describe('Shared shell components', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('prevents busy-button activation and enables it when loading finishes', () => {
    const fixture = TestBed.createComponent(ButtonExample); fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeTrue(); button.click();
    expect(fixture.componentInstance.count).toBe(0);
    fixture.componentInstance.busy = false; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    button.click(); expect(fixture.componentInstance.count).toBe(1);
  });
  it('exposes metric content and hides its value while loading', () => {
    const fixture = TestBed.createComponent(KpiCard);
    const metric: KpiMetric = { label: 'Users', value: '142', detail: '+6', icon: 'Users', tone: 'primary' };
    fixture.componentRef.setInput('metric', metric); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('142');
    fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    expect(host.textContent).not.toContain('142');
    expect(host.querySelector('article')!.getAttribute('aria-busy')).toBe('true');
  });
  it('announces errors and emits retry only on user activation', () => {
    const fixture = TestBed.createComponent(FeedbackState);
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('title', 'Unavailable');
    fixture.componentRef.setInput('actionLabel', 'Try again');
    const retry = jasmine.createSpy('retry'); fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(retry).not.toHaveBeenCalled(); host.querySelector('button')!.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
