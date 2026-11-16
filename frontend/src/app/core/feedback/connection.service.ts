import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

/** Connectivity checks retry a safe read only. Mutations are never replayed. */
@Injectable({ providedIn: 'root' })
export class ConnectionService {
    private readonly window = inject(DOCUMENT).defaultView;
    readonly reachable = signal(this.window?.navigator.onLine !== false);
    readonly countdown = signal(5);
    readonly retrying = signal(false);
    private readonly recovered = new Subject<void>();
    readonly reconnected = this.recovered.asObservable();
    private probe: (() => Promise<boolean>) | undefined;
    private timer?: ReturnType<typeof setInterval>;
    private attempt = 0;
    private destroyed = false;
    constructor() {
        const offline = () => this.unreachable();
        const online = () => { void this.retry(); };
        this.window?.addEventListener('offline', offline);
        this.window?.addEventListener('online', online);
        if (!this.reachable()) this.schedule();
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true; clearInterval(this.timer); this.recovered.complete();
            this.window?.removeEventListener('offline', offline); this.window?.removeEventListener('online', online);
        });
    }
    setProbe(probe: () => Promise<boolean>): void { this.probe = probe; }
    unreachable(): void { const wasOnline = this.reachable(); this.reachable.set(false); if (wasOnline || !this.timer) this.schedule(); }
    connected(): void {
        const changed = !this.reachable();
        this.reachable.set(true); this.attempt = 0; this.retrying.set(false);
        clearInterval(this.timer); this.timer = undefined;
        if (changed) this.recovered.next();
    }
    async retry(): Promise<void> {
        if (this.retrying() || this.destroyed) return;
        clearInterval(this.timer); this.timer = undefined; this.retrying.set(true);
        let connected = false;
        try { connected = this.probe ? await this.probe() : this.window?.navigator.onLine !== false; }
        catch { /* No raw transport error reaches the banner. */ }
        if (this.destroyed) return;
        this.retrying.set(false);
        if (connected) this.connected(); else { this.attempt++; this.schedule(); }
    }
    private schedule(): void {
        clearInterval(this.timer);
        this.countdown.set(Math.min(30, 5 * 2 ** Math.min(this.attempt, 3)));
        this.timer = setInterval(() => {
            this.countdown.update(value => Math.max(0, value - 1));
            if (!this.countdown()) void this.retry();
        }, 1000);
    }
}
