import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AuthDialogPreview } from '../../core/auth/auth-dialogs';
import { MockAuthProvider } from '../../core/auth/mock-auth.provider';
import { CanDirective } from '../../core/auth/can.directive';
import { Button } from '../../shared/button';
import { PageHeader } from '../../shared/page-header';
import { Login } from './login';
@Component({
  selector: 'iam-auth-showcase', imports: [RouterLink, Button, PageHeader, CanDirective, Login],
  template: `
    <iam-page-header title="Authentication Showcase" description="Protected development-only previews. No production route is registered." icon="Shield" />
    <section class="panel showcase"><h2>Authentication surfaces</h2><p>Embedded login previews never send credentials. Use Sign out to test the actual mock sign-in flow.</p><a class="button" routerLink="/profile">Open My Profile layout</a><button iamButton (click)="auth.confirmLogout.set(true)">Sign out to test login</button><label>Login form state<select class="field" [value]="state()" (change)="selectState($event)"><option value="normal">Normal and validation</option><option value="loading">Loading</option><option value="expired">Session expired message</option><option value="invalid">Invalid credentials</option></select></label><iam-login [previewState]="state()" [embedded]="true" /></section>
    <section class="panel showcase"><h2>Permission-aware actions</h2><button iamButton *iamCan="'admin.configure'">Configuration permitted</button><p>Use the mock adapter to remove configuration permission, then refresh access. Backend authorization remains required.</p><button iamButton (click)="removeConfiguration()">Remove configuration permission</button><button iamButton (click)="auth.revalidate()">Refresh permissions</button><button iamButton (click)="removeShowcase()">Remove showcase permission</button></section>
    <section class="panel showcase"><h2>Session dialogs</h2><button iamButton (click)="preview.mode.set('idle')">Preview Idle warning</button><button iamButton (click)="preview.mode.set('expired')">Preview Session expired</button><button iamButton (click)="preview.mode.set('logout')">Preview Logout confirmation</button></section>
  `,
  styles: '.showcase { padding: var(--iam-space-5); margin-bottom: 16px; }h2 { margin: 0 0 12px; }.button { margin: 4px; }label { display: block; margin: 16px 0; }.field { margin-left: 12px; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShowcase {
  protected readonly auth = inject(AuthFacade);
  protected readonly preview = inject(AuthDialogPreview);
  private readonly mock = inject(MockAuthProvider);
  protected readonly state = signal<'normal' | 'loading' | 'invalid' | 'expired'>('normal');
  protected selectState(event: Event): void { const value = (event.target as HTMLSelectElement).value; if (value === 'normal' || value === 'loading' || value === 'invalid' || value === 'expired') this.state.set(value); }
  protected removeConfiguration(): void { this.mock.setPermissions((this.auth.user()?.permissions ?? []).filter((permission) => permission !== 'admin.configure')); void this.auth.revalidate(); }
  protected removeShowcase(): void { this.mock.setPermissions((this.auth.user()?.permissions ?? []).filter((permission) => permission !== 'showcase.view')); void this.auth.revalidate(); }
}
