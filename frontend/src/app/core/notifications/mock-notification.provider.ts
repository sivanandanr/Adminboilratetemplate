import { Injectable } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';
import { NotificationPage, NotificationProvider, NotificationQuery, SmartNotification, notificationCategories } from './notification.models';
@Injectable({ providedIn: 'root' })
export class MockNotificationProvider implements NotificationProvider {
    private items = this.fixtures();
    private fixtures(): SmartNotification[] { const titles = ['Approval task assigned', 'Access request updated', 'Provisioning completed', 'Access review due', 'Workflow escalation', 'System announcement']; return Array.from({ length: 30 }, (_, index) => ({ id: `notification-${index + 1}`, title: titles[index % 6], message: 'Development notification fixture. Open the linked workspace to review details.', category: notificationCategories[index % 6], createdAt: Date.UTC(2026, 10, 15, 2, 0) - index * 3600000, read: index % 3 === 0, link: index % 6 === 5 ? undefined : '/administration' })); }
    list(query: NotificationQuery): Observable<NotificationPage> { return defer(() => { const items = this.items.filter(item => (!query.category || item.category === query.category) && (!query.unreadOnly || !item.read)); const start = Math.max(0, Number(query.cursor) || 0); const limit = Math.min(50, Math.max(1, query.limit)); return of({ items: items.slice(start, start + limit), unreadCount: this.items.filter(item => !item.read).length, nextCursor: start + limit < items.length ? String(start + limit) : undefined }); }).pipe(delay(120)); }
    markRead(ids: readonly string[], read: boolean): Observable<void> { return defer(() => { this.items = this.items.map(item => ids.includes(item.id) ? { ...item, read } : item); return of(undefined); }).pipe(delay(120)); }
    markAllRead(): Observable<void> { return defer(() => { this.items = this.items.map(item => ({ ...item, read: true })); return of(undefined); }).pipe(delay(120)); }
    clearCache(): void { this.items = this.fixtures(); }
}
