import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
import { AUTH_CLOCK } from './auth.models';
import { AuthFacade } from './auth.facade';
import { BlockUiService } from '../feedback/block-ui.service';
import { SessionChannel } from './session-channel';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AuthFacade);
  private readonly config = inject(AUTH_CONFIG);
  private readonly clock = inject(AUTH_CLOCK);
  private readonly blockUi = inject(BlockUiService);
  private readonly channel = inject(SessionChannel);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private activeUser: string | null = null;
  private lastActivity = this.clock();
  private lastBroadcast = 0;
  private lastValidation = 0;
  readonly warning = signal(false);
  readonly remaining = signal(0);
  readonly renewing = signal(false);
  readonly renewalError = signal('');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) { this.activeUser = null; this.warning.set(false); this.renewalError.set(''); }
      else if (user.id !== this.activeUser) { this.activeUser = user.id; this.lastActivity = this.clock(); }
    });
    timer(0, 1000).pipe(takeUntilDestroyed()).subscribe(() => this.check());
    const activity = (event: Event) => {
      if (event instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
      this.recordActivity();
    };
    for (const event of ['pointerdown', 'keydown', 'touchstart', 'wheel']) this.document.addEventListener(event, activity, { passive: true, capture: true });
    const resume = () => {
      if (this.document.visibilityState === 'hidden') return;
      this.check();
      if (this.auth.isAuthenticated() && this.clock() - this.lastValidation > 5000) {
        this.lastValidation = this.clock(); void this.auth.revalidate();
      }
    };
    this.document.addEventListener('visibilitychange', resume);
    this.document.defaultView?.addEventListener('focus', resume);
    this.destroyRef.onDestroy(() => {
      for (const event of ['pointerdown', 'keydown', 'touchstart', 'wheel']) this.document.removeEventListener(event, activity, true);
      this.document.removeEventListener('visibilitychange', resume); this.document.defaultView?.removeEventListener('focus', resume);
    });
    this.channel.messages.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.type === 'logout' && this.auth.isAuthenticated()) this.auth.invalidate('logout', false);
      if (event.type === 'activity' && event.at <= this.clock() + 1000 && event.at > this.lastActivity && !this.warning()) {
        this.check();
        if (this.auth.isAuthenticated()) this.lastActivity = Math.min(this.clock(), event.at);
      }
      if (event.type === 'renewed' && this.auth.isAuthenticated()) {
        void this.auth.revalidate().then((valid) => { if (valid) { this.lastActivity = this.clock(); this.warning.set(false); this.check(); } });
      }
    });
  }

  recordActivity(): void {
    this.check();
    if (!this.auth.isAuthenticated() || this.warning()) return;
    this.lastActivity = this.clock();
    const interval = Math.min(5000, this.config.warningMs / 3, this.config.idleTimeoutMs / 5);
    if (this.clock() - this.lastBroadcast > interval) { this.lastBroadcast = this.clock(); this.channel.send({ type: 'activity', at: this.clock() }); }
  }

  check(): void {
    const session = this.auth.session();
    if (!session || !this.auth.isAuthenticated()) return;
    if (this.activeUser !== session.user.id) { this.activeUser = session.user.id; this.lastActivity = this.clock(); }
    // Foreground server work counts as activity; server expiry remains the security control.
    if (this.blockUi.visible()) {
      this.lastActivity = this.clock();
      if (this.clock() - this.lastBroadcast >= 1000) {
        this.lastBroadcast = this.clock(); this.channel.send({ type: 'activity', at: this.clock() });
      }
    }
    const idleRemaining = this.lastActivity + this.config.idleTimeoutMs - this.clock();
    const absoluteRemaining = session.expiresAt - this.auth.serverNow();
    const remainingMs = Math.min(idleRemaining, absoluteRemaining);
    this.remaining.set(Math.max(0, Math.ceil(remainingMs / 1000)));
    if (remainingMs <= 0) { this.warning.set(false); void this.auth.logout('expired'); return; }
    this.warning.set(remainingMs <= this.config.warningMs);
  }

  async continueSession(): Promise<void> {
    if (this.renewing()) return;
    this.renewing.set(true); this.renewalError.set('');
    try {
      if (await this.auth.renew()) {
        this.lastActivity = this.clock(); this.warning.set(false);
        this.channel.send({ type: 'renewed', at: this.clock() }); this.check();
      }
    } catch { this.renewalError.set('The service could not confirm renewal. Your session has not been extended.'); }
    finally { this.renewing.set(false); }
  }
}
