import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FeedbackTone } from '../../core/feedback/toast.service';
import { Icon, IconName } from '../icon';

/** Circular tone tile shared by toasts, modal headers and notification entries. */
@Component({
  selector: 'smart-feedback-icon', imports: [Icon],
  template: `<span [attr.data-tone]="tone()"><iam-icon [name]="icon()" [size]="18" /></span>`,
  styles: `
    :host { display:inline-flex; flex-shrink:0; }
    span { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; background:var(--iam-info-fill); color:var(--iam-info-text); }
    [data-tone=success] { background:var(--iam-feedback-success-fill); color:var(--iam-feedback-success-icon); }
    [data-tone=warning] { background:var(--iam-warning-fill); color:var(--iam-feedback-muted); }
    [data-tone=error] { background:var(--iam-feedback-error-fill); color:var(--iam-feedback-danger-text); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartFeedbackIcon {
  readonly tone = input<FeedbackTone>('info');
  readonly name = input<IconName | null>(null);
  readonly icon = computed<IconName>(() => this.name() ?? (this.tone() === 'success' ? 'Check' : this.tone() === 'info' ? 'Info' : this.tone() === 'error' ? 'X' : 'TriangleAlert'));
}
