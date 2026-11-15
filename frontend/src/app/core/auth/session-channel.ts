import { Injectable, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';

export interface SessionEvent { readonly type: 'logout' | 'activity' | 'renewed'; readonly at: number; }
@Injectable({ providedIn: 'root' })
export class SessionChannel implements OnDestroy {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('smartiam-session-v1') : null;
  private readonly incoming = new Subject<SessionEvent>();
  readonly messages = this.incoming.asObservable();
  private readonly key = 'smartiam.session.event';
  private readonly storageHandler = (event: StorageEvent) => {
    if (event.key === this.key && event.newValue) { try { this.receive(JSON.parse(event.newValue)); } catch { /* Ignore malformed coordination data. */ } }
  };
  constructor() {
    if (this.channel) this.channel.onmessage = (event: MessageEvent<unknown>) => this.receive(event.data);
    else this.window?.addEventListener('storage', this.storageHandler);
  }
  send(event: SessionEvent): void {
    if (this.channel) this.channel.postMessage(event);
    else {
      // Transient event metadata only: never users, passwords, sessions or tokens.
      try { this.window?.localStorage.setItem(this.key, JSON.stringify(event)); this.window?.localStorage.removeItem(this.key); } catch { /* Single-tab behavior remains available. */ }
    }
  }
  private receive(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    const event = value as Partial<SessionEvent>;
    if (['logout', 'activity', 'renewed'].includes(event.type ?? '') && typeof event.at === 'number' && Number.isFinite(event.at)) this.incoming.next(event as SessionEvent);
  }
  ngOnDestroy(): void { this.channel?.close(); this.window?.removeEventListener('storage', this.storageHandler); this.incoming.complete(); }
}
