import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SmartModal } from './modal';
import { SmartTextbox } from './textbox';
import { SmartTextarea } from './textarea';
import { Button } from '../button';
import { Icon } from '../icon';
import { ConfirmOptions, ConfirmResult, DialogService, MessageBoxOptions } from '../../core/feedback/dialog.service';
@Component({ selector: 'smart-message-box', imports: [SmartModal, Button, Icon], template: `<smart-modal [open]="true" [title]="options().title" [description]="options().message" (closed)="completed.emit({confirmed:false})"><p><iam-icon [name]="options().tone === 'error' || options().tone === 'warning' ? 'CircleAlert' : options().tone === 'info' ? 'Bell' : 'CircleCheck'" /> {{ options().tone ?? 'info' }}</p><div class="smart-actions" data-placement="dialog">@if (options().secondaryLabel) { <button iamButton type="button" (click)="completed.emit({confirmed:false})">{{ options().secondaryLabel }}</button> }<button iamButton type="button" variant="primary" data-initial-focus (click)="completed.emit({confirmed:true})">{{ options().primaryLabel ?? 'OK' }}</button></div></smart-modal>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartMessageBox {
    readonly options = input.required<MessageBoxOptions>();
    readonly completed = output<ConfirmResult>();
}
@Component({ selector: 'smart-confirm-dialog', imports: [SmartModal, SmartTextbox, SmartTextarea, ReactiveFormsModule, Button], template: `
 <smart-modal [open]="true" [title]="options().title" [description]="options().message" [closable]="!busy() || !!options().cancellationSafe" (closed)="cancel()">
 @if (options().reason) { <smart-textarea label="Reason" [formControl]="reason" [required]="options().reason === 'required'" [readonly]="busy()" /> }
 @if (options().typedText) { <smart-textbox label="Confirmation text" [hint]="'Type ' + options().typedText + ' to continue.'" [formControl]="typed" [readonly]="busy()" /> }
 @if (failure()) { <p role="alert">{{ failure() }}</p> }
 <div class="smart-actions" data-placement="dialog"><button iamButton type="button" data-initial-focus [disabled]="busy() && !options().cancellationSafe" (click)="cancel()">Cancel</button><button iamButton type="button" [variant]="options().kind === 'delete' ? 'danger' : 'primary'" [loading]="busy()" (click)="confirm()">{{ busy() ? 'Processing…' : failure() ? 'Retry' : options().primaryLabel ?? 'Confirm' }}</button></div>
 </smart-modal>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartConfirmDialog implements OnDestroy {
    readonly options = input.required<ConfirmOptions>();
    readonly completed = output<ConfirmResult>();
    readonly reason = new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) });
    readonly typed = new FormControl('', { nonNullable: true });
    readonly busy = signal(false);
    readonly failure = signal('');
    private controller?: AbortController;
    private destroyed = false;
    private settled = false;
    cancel(): void { if (this.settled || (this.busy() && !this.options().cancellationSafe))
        return; this.controller?.abort(); this.settled = true; this.completed.emit({ confirmed: false }); }
    async confirm(): Promise<void> {
        if (this.busy() || this.settled)
            return;
        if ((this.options().reason === 'required' && !this.reason.value.trim()) || this.reason.invalid || (this.options().typedText && this.typed.value !== this.options().typedText)) {
            this.failure.set('Provide the required reason and matching confirmation text.');
            this.reason.markAsTouched();
            this.typed.markAsTouched();
            return;
        }
        this.busy.set(true);
        this.failure.set('');
        this.controller = new AbortController();
        try {
            await this.options().execute?.({ reason: this.reason.value.trim(), signal: this.controller.signal });
            if (!this.destroyed && !this.settled) {
                this.settled = true;
                this.completed.emit({ confirmed: true, reason: this.reason.value.trim() });
            }
        }
        catch {
            if (!this.destroyed && !this.settled)
                this.failure.set('The action could not be completed. Check the result before retrying.');
        }
        finally {
            if (!this.destroyed)
                this.busy.set(false);
        }
    }
    ngOnDestroy(): void { this.destroyed = true; this.controller?.abort(); }
}
@Component({ selector: 'smart-dialog-host', imports: [SmartMessageBox, SmartConfirmDialog], template: `@for (request of active(); track request.id) { @if (request.type === 'message') { <smart-message-box [options]="request.options" (completed)="dialogs.settle(request.id,$event)" /> }@else { <smart-confirm-dialog [options]="request.options" (completed)="dialogs.settle(request.id,$event)" /> } }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDialogHost {
    readonly dialogs = inject(DialogService);
    readonly active = computed(() => this.dialogs.requests().slice(0, 1));
}
