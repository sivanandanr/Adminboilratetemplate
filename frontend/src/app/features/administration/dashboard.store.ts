import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, of, switchMap, tap } from 'rxjs';
import { DashboardScenario, DashboardState } from './dashboard.models';
import { MockDashboardAdapter } from './mock-dashboard.adapter';

/** Feature facade: orchestrates cancellable mock loads and exposes typed UI state. */
@Injectable()
export class DashboardStore {
  private readonly adapter = inject(MockDashboardAdapter);
  private readonly requests = new BehaviorSubject<DashboardScenario>('normal');
  private readonly current = signal<DashboardState>({ status: 'loading' });
  readonly state = this.current.asReadonly();

  constructor() {
    this.requests.pipe(
      tap(() => this.current.set({ status: 'loading' })),
      switchMap((scenario) => this.adapter.load(scenario).pipe(
        map((data): DashboardState => data ? { status: 'ready', data } : { status: 'empty' }),
        catchError(() => of<DashboardState>({ status: 'error', message: 'The mock dashboard could not be loaded. Try again to restore the sample data.' })),
      )),
      takeUntilDestroyed(),
    ).subscribe((state) => this.current.set(state));
  }

  load(scenario: DashboardScenario = 'normal'): void { this.requests.next(scenario); }
}
