import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthDialogs } from './core/auth/auth-dialogs';
import { AuthFacade } from './core/auth/auth.facade';
import { FeedbackState } from './shared/feedback-state';
import { SmartToastContainer } from './shared/ui/toast';
import { SmartDialogHost } from './shared/ui/dialogs';
import { BlockUiService, SmartBlockUi } from './shared/ui/block-ui';
import { SmartBackgroundTasks, TaskService } from './shared/ui/tasks';
import { ToastService } from './core/feedback/toast.service';
import { DialogService } from './core/feedback/dialog.service';
import { ProgressService } from './core/feedback/progress.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuthDialogs, FeedbackState, SmartToastContainer, SmartDialogHost, SmartBlockUi, SmartBackgroundTasks],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthFacade);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly progress = inject(ProgressService);
  private readonly tasks = inject(TaskService);
  private readonly blockUi = inject(BlockUiService);
  private userId: string | undefined;
  constructor() { effect(() => { const id=this.auth.user()?.id; if(id!==this.userId) { this.userId=id; untracked(() => { this.toasts.dismissAll(); this.dialogs.cancelAll(); this.progress.clear(); this.blockUi.reset(); this.tasks.setOwner(id ?? null); }); } }); }
}
