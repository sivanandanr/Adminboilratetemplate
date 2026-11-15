import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
export const notificationCategories = ['approval', 'access-request', 'provisioning', 'access-review', 'workflow', 'system'] as const;
export type NotificationCategory = typeof notificationCategories[number];
export interface SmartNotification {
    readonly id: string;
    readonly title: string;
    readonly message: string;
    readonly category: NotificationCategory;
    readonly createdAt: number;
    readonly read: boolean;
    readonly link?: string;
}
export interface NotificationQuery {
    readonly limit: number;
    readonly cursor?: string;
    readonly category?: NotificationCategory;
    readonly unreadOnly?: boolean;
}
export interface NotificationPage {
    readonly items: readonly SmartNotification[];
    readonly unreadCount: number;
    readonly nextCursor?: string;
}
export interface NotificationProvider {
    list(query: NotificationQuery): Observable<NotificationPage>;
    markRead(ids: readonly string[], read: boolean): Observable<void>;
    markAllRead(): Observable<void>;
    clearCache(): void;
}
export const NOTIFICATION_PROVIDER = new InjectionToken<NotificationProvider>('NOTIFICATION_PROVIDER');
export function safeNotificationLink(value: unknown): string | undefined { if (typeof value !== 'string' || !/^\/(?!\/)/.test(value) || /[\\\s\u0000-\u001f]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value) || /^\/login(?:[/?#]|$)/.test(value))
    return undefined; return value; }
export const notificationCategoryLabels: Readonly<Record<NotificationCategory, string>> = { approval: 'Approval tasks', 'access-request': 'Access requests', provisioning: 'Provisioning', 'access-review': 'Access reviews', workflow: 'Workflow escalations', system: 'System announcements' };
