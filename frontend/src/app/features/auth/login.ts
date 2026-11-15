import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AUTH_CONFIG } from '../../core/auth/auth.config';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AuthProviderId, safeReturnUrl } from '../../core/auth/auth.models';
import { UsernamePreference } from '../../core/auth/username-preference';
import { Button } from '../../shared/button';
import { Icon } from '../../shared/icon';
import { ApiError } from '../../core/auth/api-error';

@Component({
  selector: 'iam-login', imports: [ReactiveFormsModule, Button, Icon],
  templateUrl: './login.html', styleUrl: './login.css', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly auth = inject(AuthFacade);
  protected readonly config = inject(AUTH_CONFIG);
  private readonly preference = inject(UsernamePreference);
  private readonly route = inject(ActivatedRoute);
  protected readonly busy = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly error = signal('');
  readonly previewState = input<'normal' | 'loading' | 'invalid' | 'expired' | null>(null);
  readonly embedded = input(false);
  protected readonly form = new FormGroup({
    provider: new FormControl<AuthProviderId>(this.config.providers[0], { nonNullable: true }),
    username: new FormControl(this.preference.read(), { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(256)] }),
    remember: new FormControl(!!this.preference.read(), { nonNullable: true }),
  });
  private readonly selected = toSignal(this.form.controls.provider.valueChanges, { initialValue: this.config.providers[0] });
  protected readonly local = computed(() => this.selected() === 'mock' || this.selected() === 'local');
  protected readonly reason = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly providerLabels: Record<AuthProviderId, string> = { mock: 'Mock — local development', local: 'Local username and password', entra: 'Microsoft Entra ID', ad: 'Active Directory' };

  protected async signIn(provider = this.form.controls.provider.value): Promise<void> {
    if (this.previewState() !== null) { this.form.markAllAsTouched(); this.error.set('Preview only: no sign-in request was sent.'); return; }
    if (this.busy() || this.auth.signingOut()) return;
    if ((provider === 'mock' || provider === 'local') && this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true); this.error.set('');
    const values = this.form.getRawValue();
    this.preference.save(values.username.trim(), values.remember);
    try {
      await this.auth.signIn({ provider, ...(provider === 'mock' || provider === 'local' ? { username: values.username.trim(), password: values.password } : {}), returnUrl: safeReturnUrl(this.reason().get('returnUrl')) });
    } catch (error: unknown) { this.error.set(error instanceof ApiError && error.status === 401 ? 'Invalid username or password.' : 'Unable to sign in. Check your authentication service and connection, then try again.'); }
    finally { this.form.controls.password.reset(''); this.busy.set(false); }
  }
}
