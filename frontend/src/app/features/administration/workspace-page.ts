import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PageMetadata } from '../../layout/navigation';
import { FeedbackState } from '../../shared/feedback-state';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'iam-workspace-page',
  imports: [PageHeader, FeedbackState, RouterLink],
  template: `
    <iam-page-header [title]="data().label" [icon]="data().icon" description="SmartIAM administration">
      <a page-actions class="button" routerLink="/administration">Back to Administration</a>
    </iam-page-header>
    <iam-feedback-state kind="empty" [title]="data().label + ' placeholder'" description="This navigation destination is ready for a future feature. No backend service or administrative operation is connected." />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePage {
  // Typed metadata comes only from our local route definitions.
  protected readonly data = toSignal(inject(ActivatedRoute).data.pipe(map((data) => data as PageMetadata)), { requireSync: true });
}
