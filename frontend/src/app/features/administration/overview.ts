import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from '../../shared/button';
import { FeedbackState } from '../../shared/feedback-state';
import { Icon } from '../../shared/icon';
import { KpiCard } from '../../shared/kpi-card';
import { PageHeader } from '../../shared/page-header';
import { administrationNavigation } from '../../layout/navigation';
import { DashboardScenario } from './dashboard.models';
import { DashboardStore } from './dashboard.store';
import { MockDashboardAdapter, mockDashboard } from './mock-dashboard.adapter';
import { RoleSummaryPanel } from './role-summary';
import { DashboardSupport } from './dashboard-support';
import { AuthFacade } from '../../core/auth/auth.facade';
import { CanDirective } from '../../core/auth/can.directive';
import { requiredForPath } from '../../core/auth/auth.models';

@Component({
  selector: 'iam-overview',
  imports: [Icon, RouterLink, Button, KpiCard, PageHeader, FeedbackState, RoleSummaryPanel, DashboardSupport, CanDirective],
  providers: [DashboardStore, MockDashboardAdapter],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Overview {
  private readonly auth = inject(AuthFacade);
  protected readonly store = inject(DashboardStore);
  protected readonly title = inject(ActivatedRoute).snapshot.data['label'] as string;
  protected readonly actionsOpen = signal(false);
  protected readonly metrics = computed(() => {
    const state = this.store.state();
    return state.status === 'ready' ? state.data.metrics : mockDashboard.metrics;
  });
  protected readonly cards = administrationNavigation.slice(1, 6);
  protected allowed(path: string): boolean { return this.auth.canAll(requiredForPath(path)); }
  protected readonly cardTitles = ['Roles & Permissions', 'System Settings', 'Notification Settings', 'Audit Configuration', 'Schedulers & Jobs'];
  protected readonly descriptions = ['Manage roles, permissions and access control', 'Global configuration, security and platform settings', 'Email, alerts, templates and delivery rules', 'Audit policies, log retention and compliance', 'Configure and monitor background jobs'];
  @ViewChild('actionTrigger') private actionTrigger?: ElementRef<HTMLButtonElement>;

  protected toggleActions(): void { this.actionsOpen.update((open) => !open); }

  protected preview(scenario: DashboardScenario): void {
    this.actionsOpen.set(false);
    this.store.load(scenario);
    this.actionTrigger?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event']) protected dismissOutside(event: Event): void {
    if (event.target instanceof Element && !event.target.closest('[data-context-actions]')) this.actionsOpen.set(false);
  }
  @HostListener('document:keydown.escape') protected dismissActions(): void {
    if (this.actionsOpen()) { this.actionsOpen.set(false); this.actionTrigger?.nativeElement.focus(); }
  }
}
