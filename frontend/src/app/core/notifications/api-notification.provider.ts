import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AUTH_CONFIG } from '../auth/auth.config';
import { NotificationCategory, NotificationPage, NotificationProvider, NotificationQuery, SmartNotification, notificationCategories, safeNotificationLink } from './notification.models';
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid notification response'); return value as Record<string, unknown>; }
export function parseNotificationPage(value: unknown): NotificationPage {
    const page = record(value);
    if (!Array.isArray(page['items']) || page['items'].length > 50 || !Number.isSafeInteger(page['unreadCount']) || (page['unreadCount'] as number) < 0)
        throw new Error('Invalid notification page');
    const items: SmartNotification[] = page['items'].map((value: unknown) => { const item = record(value); for (const key of ['id', 'title', 'message'])
        if (typeof item[key] !== 'string' || (item[key] as string).length > (key === 'message' ? 1000 : 200))
            throw new Error('Invalid notification text'); if (!notificationCategories.includes(item['category'] as NotificationCategory) || typeof item['read'] !== 'boolean' || typeof item['createdAt'] !== 'number' || !Number.isFinite(item['createdAt']) || Math.abs(item['createdAt']) > 8.64e15)
        throw new Error('Invalid notification metadata'); return { id: item['id'] as string, title: item['title'] as string, message: item['message'] as string, category: item['category'] as NotificationCategory, createdAt: item['createdAt'], read: item['read'], link: safeNotificationLink(item['link']) }; });
    if (new Set(items.map(item => item.id)).size !== items.length)
        throw new Error('Duplicate notifications');
    const cursor = page['nextCursor'];
    if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 256))
        throw new Error('Invalid notification cursor');
    return { items, unreadCount: page['unreadCount'] as number, nextCursor: cursor as string | undefined };
}
@Injectable({ providedIn: 'root' })
export class ApiNotificationProvider implements NotificationProvider {
    private readonly http = inject(HttpClient);
    private readonly base = inject(AUTH_CONFIG).apiBase.replace(/\/$/, '') + '/notifications';
    list(query: NotificationQuery): Observable<NotificationPage> { let params = new HttpParams().set('limit', Math.min(50, Math.max(1, query.limit))); if (query.cursor)
        params = params.set('cursor', query.cursor); if (query.category)
        params = params.set('category', query.category); if (query.unreadOnly)
        params = params.set('unreadOnly', true); return this.http.get<unknown>(this.base, { params }).pipe(map(parseNotificationPage)); }
    markRead(ids: readonly string[], read: boolean): Observable<void> { return this.http.patch<void>(this.base + '/read', { ids, read }); }
    markAllRead(): Observable<void> { return this.http.post<void>(this.base + '/read-all', {}); }
    clearCache(): void { }
}
