import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthDialogs } from './core/auth/auth-dialogs';
import { AuthFacade } from './core/auth/auth.facade';
import { FeedbackState } from './shared/feedback-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuthDialogs, FeedbackState],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthFacade);
}
