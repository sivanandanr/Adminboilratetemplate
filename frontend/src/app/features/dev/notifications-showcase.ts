import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { NOTIFICATION_PROVIDER, NotificationPage, NotificationProvider, NotificationQuery } from '../../core/notifications/notification.models';
import { MockNotificationProvider } from '../../core/notifications/mock-notification.provider';
import { NotificationStore } from '../../core/notifications/notification.store';
import { SmartNotificationCenter } from '../../shared/ui/notifications';
@Injectable()
class DemoNotificationProvider implements NotificationProvider {
    readonly scenario = signal('normal');
    private readonly mock = new MockNotificationProvider();
    list(query: NotificationQuery): Observable<NotificationPage> { return this.scenario() === 'loading' ? NEVER : this.scenario() === 'error' ? throwError(() => new Error('PRIVATE_INTERNAL_DEMO_DETAIL')) : this.scenario() === 'empty' ? of({ items: [], unreadCount: 0 }) : this.mock.list(query); }
    markRead(ids: readonly string[], read: boolean): Observable<void> { return this.mock.markRead(ids, read); }
    markAllRead(): Observable<void> { return this.mock.markAllRead(); }
    clearCache(): void { this.mock.clearCache(); }
}
@Component({ selector: 'iam-notifications-showcase', imports: [SmartNotificationCenter], providers: [DemoNotificationProvider, NotificationStore, { provide: NOTIFICATION_PROVIDER, useExisting: DemoNotificationProvider }], template: `<section class="panel demo"><label>Notification scenario<select class="smart-input" [value]="provider.scenario()" (change)="scenario($event)"><option value="normal">Normal</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></label><p>Development-only notification scenarios use a separate in-memory provider from the header.</p></section><smart-notification-center />`, styles: `.demo { padding:16px; margin-bottom:16px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class NotificationsShowcase {
    readonly provider = inject(DemoNotificationProvider);
    readonly store = inject(NotificationStore);
    scenario(event: Event): void { this.provider.scenario.set((event.target as HTMLSelectElement).value); this.store.load(); }
}
