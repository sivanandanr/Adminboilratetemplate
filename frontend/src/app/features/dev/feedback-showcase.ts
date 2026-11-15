import { abortableDemoDelay } from './demo-utils';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ToastService, FeedbackTone } from '../../core/feedback/toast.service';
import { ConfirmationService, DialogService } from '../../core/feedback/dialog.service';
import { ErrorPresenter } from '../../core/feedback/error-presenter';
import { ProgressService } from '../../core/feedback/progress.service';
import { ApiError, ApiErrorKind } from '../../core/auth/api-error';
import { PageHeader } from '../../shared/page-header';
import { SmartButton, SmartCard, SmartDrawer, SmartLoadingOverlay } from '../../shared/ui';
import { SmartModal } from '../../shared/ui/modal';
import { SmartOperationProgress, SmartProgressBar, SmartSpinner } from '../../shared/ui/progress';
@Component({ selector: 'iam-feedback-showcase', imports: [PageHeader, SmartButton, SmartCard, SmartDrawer, SmartModal, SmartLoadingOverlay, SmartOperationProgress, SmartProgressBar, SmartSpinner], template: `
 <iam-page-header title="Feedback Showcase" description="Development-only feedback scenarios; no backend changes are performed." icon="Bell" />
 <div class="examples"><smart-card title="Toast variants"><div class="actions">@for(tone of tones;track tone){<smart-button [label]="tone + ' toast'" (pressed)="toast(tone)" />}<smart-button label="Action toast" (pressed)="actionToast()" /><smart-button label="Dismiss all toasts" (pressed)="toasts.dismissAll()" /></div><p>Success/info/warning expire after six seconds. Error and action messages remain until dismissed. Hover or focus pauses expiry.</p></smart-card>
 <smart-card title="Dialogs and confirmation"><div class="actions">@for(tone of tones;track tone){<smart-button [label]="tone + ' message box'" (pressed)="message(tone)" />}<smart-button label="Confirm action" (pressed)="confirm('confirm')" /><smart-button label="Delete with reason" variant="danger" (pressed)="confirm('delete')" /><smart-button label="Unsaved changes dialog" (pressed)="confirm('unsaved')" /><smart-button label="Logout confirmation demo" (pressed)="confirm('logout')" /><smart-button label="Privileged confirmation" (pressed)="confirm('privileged')" /><smart-button label="Fail then retry confirmation" (pressed)="retryConfirmation()" /><smart-button label="Open modal" (pressed)="modal.set(true)" /><smart-button label="Open feedback drawer" (pressed)="drawer.set(true)" /></div><p role="status">{{ result() }}</p></smart-card>
 <smart-card title="Progress and loading"><div class="actions"><smart-spinner label="Example busy indicator" /><smart-button label="Toggle page overlay" (pressed)="overlay.set(!overlay())" /><smart-button label="Start operation" (pressed)="start()" /><smart-button label="Complete next work item" [disabled]="workBusy()" (pressed)="advance()" /><smart-button label="Simulate operation failure" (pressed)="fail()" /></div><smart-progress-bar label="Unknown duration operation" text="Waiting for the service" /><smart-progress-bar label="Completed example" [percentage]="100" status="success" /><smart-progress-bar label="Failed example" text="Retry is available" status="error" /><smart-loading-overlay [loading]="overlay()"><p>Page content remains inert until loading completes.</p><smart-button label="Covered action" /></smart-loading-overlay><smart-operation-progress /></smart-card>
 <smart-card title="Safe error presentation"><div class="actions">@for(kind of errorKinds;track kind){<smart-button [label]="kind + ' error'" (pressed)="presentError(kind)" />}<smart-button label="Unexpected error" (pressed)="errors.present(newError())" /></div></smart-card></div>
 <smart-modal title="Reusable modal" description="Projected text and controls use the existing design tokens." [open]="modal()" (closed)="modal.set(false)"><smart-button label="Done" variant="primary" (pressed)="modal.set(false)" /></smart-modal>
 <smart-drawer title="Feedback details" [open]="drawer()" (closed)="drawer.set(false)"><p>The shared drawer uses the same reference-counted scroll lock as the modal.</p><smart-button label="Close feedback drawer" (pressed)="drawer.set(false)" /></smart-drawer>`, styles: `.examples { display:grid; gap:16px; }.actions { display:flex; flex-wrap:wrap; gap:8px; }smart-progress-bar { display:block; margin:16px 0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class FeedbackShowcase {
    readonly tones: readonly FeedbackTone[] = ['success', 'info', 'warning', 'error'];
    readonly errorKinds: readonly ApiErrorKind[] = ['validation', 'unauthorized', 'forbidden', 'network', 'server', 'timeout'];
    readonly toasts = inject(ToastService);
    readonly errors = inject(ErrorPresenter);
    readonly progress = inject(ProgressService);
    private readonly dialogs = inject(DialogService);
    private readonly confirmations = inject(ConfirmationService);
    readonly modal = signal(false);
    readonly drawer = signal(false);
    readonly overlay = signal(false);
    readonly result = signal('');
    readonly workBusy = signal(false);
    private operation?: number;
    private completed = 0;
    private controller?: AbortController;
    toast(tone: FeedbackTone): void { this.toasts.show({ tone, title: `${tone} notification`, message: 'Safe development feedback message.' }); }
    actionToast(): void { this.toasts.show({ title: 'Action available', message: 'An optional action remains available until dismissed.', action: { label: 'Run example action', run: () => this.result.set('Toast action completed.') } }); }
    message(tone: FeedbackTone): void { void this.dialogs.message({ title: `${tone} message`, message: 'Message boxes render text safely and restore focus on close.', tone, primaryLabel: 'Understood', secondaryLabel: 'Cancel' }); }
    async confirm(kind: 'confirm' | 'delete' | 'unsaved' | 'logout' | 'privileged'): Promise<void> { const result = await this.confirmations.confirm({ kind, title: `${kind} confirmation`, message: 'This is a development confirmation. No records or sessions are changed.', reason: kind === 'delete' ? 'required' : kind === 'privileged' ? 'optional' : undefined, typedText: kind === 'privileged' ? 'CONFIRM' : undefined, primaryLabel: kind === 'delete' ? 'Delete' : 'Confirm', execute: async ({ signal }) => { await abortableDemoDelay(500, signal); } }); this.result.set(result.confirmed ? 'Action confirmed.' : 'Action cancelled.'); }
    async retryConfirmation(): Promise<void> { let attempts = 0; const result = await this.confirmations.confirm({ title: 'Retryable confirmation', message: 'The first mock attempt fails. Retry succeeds. No data is changed.', execute: async ({ signal }) => { await abortableDemoDelay(400, signal); if (++attempts === 1)
            throw new Error('PRIVATE_INTERNAL_DEMO_DETAIL'); } }); this.result.set(result.confirmed ? 'Retry succeeded.' : 'Action cancelled.'); }
    start(): void { if (this.operation && this.progress.items().some(item => item.id === this.operation && item.status === 'running'))
        return; this.controller = new AbortController(); this.completed = 0; this.operation = this.progress.begin('Three-item demonstration', () => this.controller?.abort()); this.progress.update(this.operation, { completed: 0, total: 3, text: 'No work items completed' }); }
    async advance(): Promise<void> { const operation = this.operation; if (!operation || this.workBusy() || !this.progress.running().some(item => item.id === operation) || !this.controller)
        return; this.workBusy.set(true); try {
        await abortableDemoDelay(200, this.controller.signal);
        this.completed++;
        this.progress.update(operation, { completed: this.completed, total: 3, text: `${this.completed} of 3 work items confirmed` });
        if (this.completed === 3)
            this.progress.finish(operation, 'success');
    }
    catch { /* Cancellation is reflected by ProgressService. */ }
    finally {
        this.workBusy.set(false);
    } }
    fail(): void { if (this.operation)
        this.progress.finish(this.operation, 'error'); }
    presentError(kind: ApiErrorKind): void { this.errors.present(new ApiError(500, kind, 'PRIVATE_INTERNAL_DEMO_DETAIL', 'demo-correlation-001')); }
    newError(): Error { return new Error('PRIVATE_INTERNAL_DEMO_DETAIL'); }
}
