import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BlockUiService } from '../../core/feedback/block-ui.service';
import { SmartModal } from './modal';
import { SmartProgressBar } from './progress';
import { Icon } from '../icon';

@Component({
    selector: 'smart-block-ui', imports: [SmartModal, SmartProgressBar, Icon],
    template: `
      <smart-modal [open]="blockUi.visible()" [title]="blockUi.current()?.title || 'Please wait'"
        [description]="blockUi.current()?.message || ''" [showClose]="false" [closable]="false"
        [busy]="true" dialogRole="alertdialog" [priority]="100">
        <smart-progress-bar [label]="blockUi.current()?.title || 'Please wait'"
          [percentage]="blockUi.current()?.percentage ?? null" [text]="progressText()"
          [showDetails]="blockUi.current()?.percentage !== null && blockUi.current()?.percentage !== undefined" />
        @if (blockUi.current()?.steps?.length) {
          <ol aria-label="Operation steps">
            @for (step of blockUi.current()?.steps; track $index; let index = $index) {
              <li [class.done]="index < (blockUi.current()?.completedSteps ?? 0)"
                [attr.aria-current]="index === blockUi.current()?.completedSteps ? 'step' : null">
                <span class="step-icon" aria-hidden="true">@if (index < (blockUi.current()?.completedSteps ?? 0)) { <iam-icon name="Check" [size]="14" /> }@else { · }</span>
                {{ step }}
              </li>
            }
          </ol>
        }
        @if (!blockUi.current()?.steps?.length) { <div class="progress-space" aria-hidden="true"></div> }
        @if (blockUi.slow()) { <p class="slow" role="status">This is taking longer than usual. You can keep waiting, and nothing is lost.</p> }
        <p modalFooter class="keep-open"><iam-icon name="Info" [size]="16" />Please keep this window open.</p>
      </smart-modal>
    `,
    styles: `
      .progress-space { height:12px; }
      ol { display:grid; gap:6px; padding:0; margin:14px 0 0; list-style:none; color:var(--iam-feedback-title); font-size:var(--iam-font-md); }
      li { display:flex; align-items:center; gap:8px; overflow-wrap:anywhere; }
      li[aria-current] { font-weight:600; }
      .step-icon { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:var(--iam-progress-track); color:var(--iam-accent); flex-shrink:0; }
      .done .step-icon { background:var(--iam-feedback-success-fill); color:var(--iam-feedback-success-icon); }
      .keep-open { display:flex; align-items:center; gap:8px; margin:0; color:var(--iam-feedback-muted); font-size:var(--iam-font-sm); line-height:18px; }
      .slow { margin:14px 0 0; color:var(--iam-feedback-muted); font-size:var(--iam-font-sm); }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartBlockUi {
    readonly blockUi = inject(BlockUiService);
    readonly progressText = computed(() => {
        const current = this.blockUi.current();
        if (current?.text) return current.text;
        const count = current?.steps?.length ?? 0;
        return count ? `Step ${Math.min(count, (current?.completedSteps ?? 0) + 1)} of ${count}` : '';
    });
}
export { BlockUiService } from '../../core/feedback/block-ui.service';
export type { BlockUiHandle, BlockUiOptions, BlockUiProgress } from '../../core/feedback/block-ui.service';
