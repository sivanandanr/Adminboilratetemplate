import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConnectionService } from '../../core/feedback/connection.service';
import { Button } from '../button';
import { Icon } from '../icon';

@Component({
    selector: 'smart-offline-banner', imports: [Button, Icon],
    template: `@if (!connection.reachable()) {
      <aside aria-label="Connection unavailable">
        <iam-icon name="TriangleAlert" [size]="18" />
        <p><span role="status">Can't reach the server. Your work on this page is safe, but changes can't be saved yet.</span>
          <span aria-live="off"> Retrying in {{ connection.countdown() }} seconds.</span></p>
        <button iamButton type="button" variant="danger" [loading]="connection.retrying()" (click)="connection.retry()"><iam-icon name="RefreshCw" [size]="16" />Retry now</button>
      </aside>
    }`,
    styles: `:host { display:block; }aside { display:flex; align-items:center; flex-wrap:wrap; gap:var(--iam-space-3); padding:var(--iam-space-2) var(--iam-space-4); color:var(--iam-progress-failed-text); background:var(--iam-feedback-error-fill); border-bottom:1px solid var(--iam-feedback-border); }p { flex:1; margin:0; min-width:min(220px,100%); font-size:var(--iam-font-sm); }button { margin-left:auto; }`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartOfflineBanner { readonly connection = inject(ConnectionService); }
export { ConnectionService } from '../../core/feedback/connection.service';
