import { Injectable, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { ErrorPresenter } from '../feedback/error-presenter';
import { NOTIFICATION_PROVIDER, NotificationCategory, NotificationQuery, SmartNotification } from './notification.models';
@Injectable({ providedIn: 'root' })
export class NotificationStore implements OnDestroy {
    private readonly provider = inject(NOTIFICATION_PROVIDER);
    private readonly auth = inject(AuthFacade);
    private readonly errors = inject(ErrorPresenter);
    readonly items = signal<readonly SmartNotification[]>([]);
    readonly unreadCount = signal(0);
    readonly nextCursor = signal<string | undefined>(undefined);
    readonly loading = signal(false);
    readonly failure = signal('');
    readonly busy = signal(false);
    readonly category = signal<NotificationCategory | undefined>(undefined);
    readonly unreadOnly = signal(false);
    private allowed = false;
    private userId: string | undefined;
    private request?: Subscription;
    private generation = 0;
    private mutationVersion = 0;
    constructor() { effect(() => { const user = this.auth.user(); const id = user?.id; const allowed = !!user?.permissions.includes('profile.view'); untracked(() => { if (id === this.userId && allowed === this.allowed)
        return; this.userId = id; this.allowed = allowed; this.clear(); if (id && allowed)
        this.load(); }); }); }
    load(more = false): void {
        if (!this.auth.isAuthenticated() || !this.auth.can('profile.view') || (more && (!this.nextCursor() || this.loading())))
            return;
        this.request?.unsubscribe();
        const generation = ++this.generation;
        this.loading.set(true);
        this.failure.set('');
        const query: NotificationQuery = { limit: 10, cursor: more ? this.nextCursor() : undefined, category: this.category(), unreadOnly: this.unreadOnly() };
        this.request = this.provider.list(query).subscribe({ next: page => { if (generation !== this.generation)
                return; this.items.update(items => [...(more ? items : []), ...page.items].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index)); this.unreadCount.set(page.unreadCount); this.nextCursor.set(page.nextCursor); this.loading.set(false); }, error: (error: unknown) => { if (generation !== this.generation)
                return; this.failure.set(this.errors.describe(error).message); this.loading.set(false); } });
    }
    filter(category: NotificationCategory | undefined, unreadOnly: boolean): void { this.category.set(category); this.unreadOnly.set(unreadOnly); this.items.set([]); this.load(); }
    async markRead(id: string, read: boolean): Promise<void> { await this.mutate(() => this.provider.markRead([id], read)); }
    async markAllRead(): Promise<void> { await this.mutate(() => this.provider.markAllRead()); }
    private async mutate(operation: () => ReturnType<typeof this.provider.markAllRead>): Promise<void> {
        if (this.busy() || !this.auth.isAuthenticated() || !this.auth.can('profile.view'))
            return;
        const version = ++this.mutationVersion;
        this.busy.set(true);
        this.failure.set('');
        this.request?.unsubscribe();
        ++this.generation;
        this.loading.set(false);
        try {
            await firstValueFrom(operation());
            if (version === this.mutationVersion)
                this.load();
        }
        catch (error: unknown) {
            if (version === this.mutationVersion)
                this.failure.set(this.errors.describe(error).message);
        }
        finally {
            if (version === this.mutationVersion)
                this.busy.set(false);
        }
    }
    clear(): void { this.request?.unsubscribe(); ++this.generation; ++this.mutationVersion; this.provider.clearCache(); this.items.set([]); this.unreadCount.set(0); this.nextCursor.set(undefined); this.category.set(undefined); this.unreadOnly.set(false); this.busy.set(false); this.loading.set(false); this.failure.set(''); }
    ngOnDestroy(): void { this.clear(); }
}
