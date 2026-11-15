import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationStore } from '../../core/notifications/notification.store';
import { NotificationCategory, notificationCategories, notificationCategoryLabels } from '../../core/notifications/notification.models';
import { Button } from '../button';
import { Icon } from '../icon';
import { PageHeader } from '../page-header';
import { SmartFeedbackIcon } from './feedback-icon';
@Component({ selector: 'smart-notification-panel', imports: [DatePipe, RouterLink, Button, Icon, SmartFeedbackIcon], template: `<section [attr.aria-label]="label()"><header><h2>Notifications</h2><button iamButton type="button" [disabled]="store.busy() || !store.unreadCount()" (click)="store.markAllRead()"><iam-icon name="CircleCheck" />Mark all as read</button></header>@if(store.failure()) { <p role="alert">{{ store.failure() }}</p><button iamButton type="button" (click)="store.load()"><iam-icon name="RefreshCw" />Retry notifications</button> }@if(store.loading()) { <p role="status">Loading notifications…</p> }@if(!store.loading() && !store.failure() && !store.items().length) { <p role="status">No notifications.</p> }<ul>@for(item of store.items();track item.id) { <li [class.unread]="!item.read"><div class="notification-title"><smart-feedback-icon tone="info" /><strong>{{ item.title }}</strong></div><small>{{ labels[item.category] }} · <time [attr.datetime]="timestamp(item.createdAt)">{{ item.createdAt | date:'dd MMM yyyy, HH:mm':'UTC' }} UTC</time> · {{ item.read ? 'Read' : 'Unread' }}</small><p>{{ item.message }}</p><div class="smart-actions" data-placement="row"><button iamButton type="button" [disabled]="store.busy()" (click)="store.markRead(item.id,!item.read)"><iam-icon name="CircleCheck" />{{ item.read ? 'Mark unread' : 'Mark read' }}<span class="sr-only"> {{ item.title }}</span></button>@if(item.link) { <a [routerLink]="item.link">Open {{ item.title }}</a> }</div></li> }</ul>@if(store.nextCursor()) { <button iamButton type="button" [disabled]="store.loading() || store.busy()" (click)="store.load(true)"><iam-icon name="ArrowRight" />Load more notifications</button> }<footer><a routerLink="/notifications">View all notifications</a></footer></section>`, styles: `header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }h2 { margin:0; }ul { list-style:none; padding:0; margin:12px 0; }li { padding:12px; border-bottom:1px solid var(--iam-border); overflow-wrap:anywhere; }.unread { background:var(--iam-primary-soft); border-left:3px solid var(--iam-accent); }.notification-title { display:flex; align-items:center; gap:var(--iam-space-3); }small { display:block; color:var(--iam-text-secondary); }p { margin:8px 0; }a { color:var(--iam-accent); }footer { margin-top:12px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartNotificationPanel {
    readonly label=input('Notification updates');
    timestamp(value: number): string { return new Date(value).toISOString(); }
    readonly labels = notificationCategoryLabels;
    readonly store = inject(NotificationStore);
}
@Component({ selector: 'smart-notification-bell', imports: [Icon, SmartNotificationPanel], host: { 'data-header-popover': '' }, template: `<button #trigger class="icon-button notification-button" aria-label="Notifications" aria-describedby="notification-unread-description" aria-controls="notification-panel" [attr.aria-expanded]="open()" (click)="toggle()"><iam-icon name="Bell" />@if(store.unreadCount()) { <span class="unread-count" aria-hidden="true">{{ store.unreadCount() > 99 ? '99+' : store.unreadCount() }}</span> }<span id="notification-unread-description" class="sr-only" aria-live="polite">{{ store.unreadCount() }} unread</span></button>@if(open()) { <div id="notification-panel" class="notification-popover"><smart-notification-panel label="Recent notifications" /></div> }`, styles: `:host { position:relative; display:block; }.notification-button { position:relative; }.unread-count { position:absolute; top:-3px; right:-4px; background:var(--iam-primary); color:var(--iam-on-primary); border-radius:12px; font-size:10px; padding:1px 4px; min-width:16px; }.notification-popover { position:absolute; top:44px; right:0; width:min(440px,calc(100vw - 24px)); max-height:calc(100dvh - 80px); overflow:auto; background:var(--iam-surface); color:var(--iam-text); border:1px solid var(--iam-control-border); border-radius:var(--iam-radius-lg); box-shadow:var(--iam-shadow); padding:16px; z-index:var(--iam-layer-popover); }@media(max-width:767px) { .notification-popover { position:fixed; top:60px; right:12px; } }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartNotificationBell {
    readonly store = inject(NotificationStore);
    readonly open = signal(false);
    readonly opened = output<void>();
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
    @ViewChild('trigger')
    private trigger?: ElementRef<HTMLButtonElement>;
    constructor() { inject(Router).events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(event => { if (event instanceof NavigationEnd)
        this.open.set(false); }); }
    toggle(): void { this.open.update(value => !value); if (this.open())
        this.opened.emit(); }
    @HostListener('document:pointerdown', ['$event'])
    outside(event: PointerEvent): void { if (!this.element.nativeElement.contains(event.target as Node))
        this.open.set(false); }
    @HostListener('document:keydown.escape')
    close(): void { if (this.open()) {
        this.open.set(false);
        this.trigger?.nativeElement.focus();
    } }
}
@Component({ selector: 'smart-notification-center', imports: [PageHeader, SmartNotificationPanel], template: `<iam-page-header title="Notifications" description="Review your tasks and system updates." icon="Bell" /><section class="panel center"><div class="filters"><label>Category<select class="smart-input" [value]="store.category() ?? ''" (change)="category($event)"><option value="">All categories</option>@for(category of categories;track category){<option [value]="category">{{ labels[category] }}</option>}</select></label><label class="smart-choice"><input type="checkbox" [checked]="store.unreadOnly()" (change)="store.filter(store.category(),$any($event.target).checked)" />Unread only</label></div><smart-notification-panel /></section>`, styles: `.center { padding:16px; }.filters { display:flex; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; }label { display:grid; gap:4px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartNotificationCenter {
    readonly labels = notificationCategoryLabels;
    readonly store = inject(NotificationStore);
    readonly categories = notificationCategories;
    category(event: Event): void { this.store.filter((event.target as HTMLSelectElement).value as NotificationCategory || undefined, this.store.unreadOnly()); }
}
