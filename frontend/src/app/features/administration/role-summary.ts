import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button';
import { FeedbackState } from '../../shared/feedback-state';
import { Icon } from '../../shared/icon';
import { RoleSummary } from './dashboard.models';
import { CanDirective } from '../../core/auth/can.directive';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'iam-role-summary',
  imports: [Button, FeedbackState, Icon, ReactiveFormsModule, RouterLink, CanDirective],
  templateUrl: './role-summary.html',
  styleUrl: './role-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSummaryPanel {
  protected readonly auth = inject(AuthFacade);
  readonly rows = input.required<readonly RoleSummary[]>();
  readonly refresh = output<void>();
  protected readonly roleSearch = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.roleSearch.valueChanges, { initialValue: '' });
  protected readonly roles = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.rows().filter((role) => `${role.name} ${role.category} ${role.description}`.toLowerCase().includes(query));
  });
}
