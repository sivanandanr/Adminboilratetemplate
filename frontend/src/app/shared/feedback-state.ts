import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from './button';
import { Icon, IconName } from './icon';

export type FeedbackKind = 'loading' | 'empty' | 'error';
@Component({
  selector: 'iam-feedback-state, smart-empty-state',
  imports: [Icon, Button],
  template: `
    <section class="panel feedback" [attr.role]="kind() === 'error' ? 'alert' : 'status'" [attr.aria-busy]="kind() === 'loading'">
      <iam-icon [name]="icon()" [size]="32" />
      <h2>{{ title() }}</h2><p>{{ description() }}</p>
      @if (actionLabel() && kind() !== 'loading') { <button iamButton (click)="retry.emit()">{{ actionLabel() }}</button> }
    </section>
  `,
  styles: `
    :host { display: block; }.feedback { padding: var(--iam-space-6); text-align: center; }
    iam-icon { color: var(--iam-accent); }h2 { margin: 12px 0 8px; }p { margin: 0 auto 16px; color: var(--iam-text-secondary); max-width: 60ch; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackState {
  readonly kind = input.required<FeedbackKind>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly actionLabel = input('');
  readonly retry = output<void>();
  protected readonly icon = computed<IconName>(() => ({ loading: 'LoaderCircle', empty: 'Inbox', error: 'CircleAlert' } as const)[this.kind()]);
}
