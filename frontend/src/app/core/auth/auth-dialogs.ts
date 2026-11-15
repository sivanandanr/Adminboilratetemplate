import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injectable, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Button } from '../../shared/button';
import { AuthFacade } from './auth.facade';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthDialogPreview { readonly mode = signal<'idle' | 'expired' | 'logout' | null>(null); }

@Component({
  selector: 'iam-auth-dialogs', imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="auth-dialog-title" aria-describedby="auth-dialog-description" (cancel)="$event.preventDefault()">
      <h2 id="auth-dialog-title">{{ title() }}</h2>
      @if (preview.mode()) { <span class="badge">Preview only</span> }
      <p id="auth-dialog-description">{{ description() }}</p>
      @if (mode() === 'idle') {
        <p role="timer" aria-live="off">Time remaining: <strong>{{ preview.mode() ? 30 : session.remaining() }}</strong> seconds</p>
        <span class="sr-only" role="status">{{ announcement() }}</span>
        @if (session.renewalError()) { <p role="alert">{{ session.renewalError() }}</p> }
      }
      <div class="dialog-actions">
        @if (preview.mode()) { <button iamButton variant="primary" (click)="preview.mode.set(null)">Close preview</button> }
        @else if (mode() === 'idle') { <button iamButton (click)="auth.logout()">Logout Now</button><button iamButton variant="primary" [loading]="session.renewing()" (click)="session.continueSession()">{{ session.renewing() ? 'Confirming…' : 'Continue Session' }}</button> }
        @else if (mode() === 'logout') { <button iamButton (click)="auth.confirmLogout.set(false)">Cancel</button><button iamButton variant="primary" (click)="auth.logout()">Sign Out</button> }
        @else { <button iamButton variant="primary" (click)="auth.expiredNotice.set(false)">Back to Sign In</button> }
      </div>
    </dialog>
  `,
  styles: `
    dialog { width: min(460px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; margin: auto; color: var(--iam-text); background: var(--iam-surface); padding: var(--iam-space-5); border: 1px solid var(--iam-control-border); border-radius: var(--iam-radius-lg); box-shadow: var(--iam-shadow); }
    dialog::backdrop { background: var(--iam-backdrop); }h2 { margin: 0 0 12px; }p { margin: 12px 0; }.dialog-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthDialogs implements AfterViewInit {
  protected readonly auth = inject(AuthFacade);
  protected readonly session = inject(SessionService);
  protected readonly preview = inject(AuthDialogPreview);
  private readonly viewReady = signal(false);
  private previousFocus: HTMLElement | null = null;
  private previousMode: string | null = null;
  protected readonly mode = computed(() => this.session.warning() ? 'idle' : this.auth.confirmLogout() ? 'logout' : this.auth.expiredNotice() ? 'expired' : this.preview.mode());
  protected readonly title = computed(() => ({ idle: 'Session expiring', logout: 'Sign out of SmartIAM?', expired: 'Session expired' })[this.mode() ?? 'expired']);
  protected readonly description = computed(() => ({ idle: 'Your session is about to expire. Continue Session requires confirmation from the authentication service.', logout: 'You will be signed out and returned to the login page.', expired: 'Your session has ended. Sign in again to continue.' })[this.mode() ?? 'expired']);
  protected readonly announcement = computed(() => [60, 30, 10, 5, 0].includes(this.session.remaining()) ? `${this.session.remaining()} seconds remaining` : '');
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
  constructor() {
    effect(() => { if (this.session.warning() || this.auth.confirmLogout() || this.auth.expiredNotice()) this.preview.mode.set(null); });
    effect(() => {
      if (!this.viewReady()) return;
      const dialog = this.dialog!.nativeElement;
      const mode = this.mode();
      if (mode && !dialog.open) { this.previousFocus = document.activeElement as HTMLElement; dialog.showModal(); }
      else if (mode && mode !== this.previousMode) queueMicrotask(() => dialog.querySelector<HTMLButtonElement>('button')?.focus());
      else if (!this.mode() && dialog.open) { dialog.close(); if (this.previousFocus?.isConnected) this.previousFocus.focus(); this.previousFocus = null; }
      if (this.previousFocus && !this.previousFocus.isConnected) this.previousFocus = null;
      this.previousMode = mode;
    });
  }
  ngAfterViewInit(): void { this.viewReady.set(true); }
}
