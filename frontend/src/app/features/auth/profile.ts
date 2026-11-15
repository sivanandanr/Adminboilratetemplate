import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ProfileField, ProfilePatch } from '../../core/auth/auth.models';
import { Button } from '../../shared/button';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'iam-profile', imports: [DatePipe, ReactiveFormsModule, Button, PageHeader],
  template: `
    <iam-page-header title="My Profile" description="Your identity, account information and access." icon="UserRound" />
    @if (auth.user(); as user) {
      <div class="profile-grid">
        <section class="panel identity" aria-labelledby="identity-title"><span class="initials" aria-hidden="true">{{ auth.initials() }}</span><h2 id="identity-title">{{ user.displayName }}</h2><p>{{ user.designation }}</p><dl>
          <dt>Username</dt><dd>{{ user.username }}</dd><dt>Employee identifier</dt><dd>{{ user.employeeId }}</dd><dt>Manager</dt><dd>{{ user.manager }}</dd><dt>Account type</dt><dd>{{ user.accountType }}</dd><dt>Authentication provider</dt><dd>{{ user.provider }}</dd><dt>Last sign-in</dt><dd>{{ user.lastSignIn ? (user.lastSignIn | date:'medium') : 'Not available' }}</dd>
        </dl></section>
        <div class="profile-details">
          <section class="panel details" aria-labelledby="profile-fields-title"><h2 id="profile-fields-title">Profile details</h2><form [formGroup]="form" (ngSubmit)="save()" novalidate [attr.aria-busy]="saving()"><div class="fields">
            @for (field of fields; track field.key) { <div><label [for]="'profile-' + field.key">{{ field.label }}</label><input class="field" [id]="'profile-' + field.key" [formControlName]="field.key" [type]="field.key === 'email' ? 'email' : 'text'" [attr.aria-invalid]="form.controls[field.key].touched && form.controls[field.key].invalid" [attr.aria-describedby]="'error-' + field.key" /><p class="validation" [id]="'error-' + field.key">@if (form.controls[field.key].touched && form.controls[field.key].invalid) { {{ field.key === 'email' ? 'Enter a valid email address.' : 'Enter between 1 and 80 characters.' }} }</p></div> }
          </div>
          @if (!auth.can('profile.edit')) { <p>This account has read-only profile access.</p> }
          @if (message()) { <p class="feedback" [attr.role]="failed() ? 'alert' : 'status'">{{ message() }}</p> }
          <div class="actions"><button iamButton type="button" (click)="cancel()" [disabled]="saving()">Cancel</button><button iamButton variant="primary" type="submit" [loading]="saving()" [disabled]="!auth.can('profile.edit') || form.pristine">Save Changes</button></div>
          </form></section>
          <section class="panel details" aria-labelledby="access-title"><h2 id="access-title">Your access</h2><h3>Assigned roles</h3><ul>@for (role of user.roles; track role) { <li>{{ role }}</li> }</ul><h3>Effective application permissions</h3><ul>@for (permission of user.permissions; track permission) { <li>{{ permission }}</li> }</ul><p class="hint">These application permissions describe visible features. The server authorizes every operation.</p></section>
        </div>
      </div>
    }
  `,
  styleUrl: './profile.css', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  protected readonly auth = inject(AuthFacade);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly failed = signal(false);
  protected readonly fields: readonly { key: ProfileField; label: string }[] = [{ key: 'displayName', label: 'Display name' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }];
  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(128)] }),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)] }),
    designation: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)] }),
  });
  constructor() { effect(() => { this.auth.user(); this.auth.permissionsLoading(); this.reset(this.form.dirty); }); }
  protected cancel(): void { this.reset(); this.message.set('Changes cancelled.'); this.failed.set(false); }
  private reset(preserveDraft = false): void {
    const user = this.auth.user(); if (!user) return;
    for (const field of this.fields) {
      const control = this.form.controls[field.key];
      if (!preserveDraft || !user.permissions.includes('profile.edit') || !user.editableFields.includes(field.key)) control.reset(user[field.key], { emitEvent: false });
      if (this.auth.can('profile.edit') && user.editableFields.includes(field.key)) control.enable({ emitEvent: false }); else control.disable({ emitEvent: false });
    }
  }
  protected async save(): Promise<void> {
    if (this.saving() || !this.auth.can('profile.edit')) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.message.set(''); this.failed.set(false);
    try {
      const patch = Object.fromEntries(Object.entries(this.form.value).map(([key, value]) => [key, value?.trim()])) as ProfilePatch;
      await this.auth.saveProfile(patch); this.reset(); this.message.set('Profile saved.');
    } catch { this.failed.set(true); this.message.set('Profile could not be saved. Your changes have not been confirmed.'); }
    finally { this.saving.set(false); }
  }
}
