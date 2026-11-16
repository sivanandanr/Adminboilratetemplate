import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SmartModal } from './modal';
import { SmartTextbox } from './textbox';
import { SmartFormField } from './form-field';
import { Button } from '../button';
import { Icon, IconName } from '../icon';
import { ButtonVariant } from '../button';
import { FeedbackTone } from '../../core/feedback/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmOptions, ConfirmResult, DialogService, MessageBoxOptions } from '../../core/feedback/dialog.service';
@Component({ selector: 'smart-message-box', imports: [SmartModal, Button, Icon], template: `<smart-modal [open]="true" [title]="options().title" [tone]="options().tone ?? 'info'" [showClose]="false" [description]="options().message ?? options().text ?? ''" (closed)="completed.emit({confirmed:false})"><div modalFooter class="smart-actions" data-placement="dialog">@if (options().secondaryLabel) { <button iamButton type="button" (click)="completed.emit({confirmed:false})">{{ options().secondaryLabel }}</button> }<button iamButton type="button" variant="primary" data-initial-focus (click)="completed.emit({confirmed:true})"><iam-icon name="CircleCheck" />{{ options().primaryLabel ?? options().okLabel ?? 'OK' }}</button></div></smart-modal>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartMessageBox {
    readonly options = input.required<MessageBoxOptions>();
    readonly completed = output<ConfirmResult>();
}
let nextReason = 0;
@Component({
    selector: 'smart-confirm-dialog',
    imports: [SmartModal, SmartTextbox, SmartFormField, ReactiveFormsModule, Button, Icon],
    template: `
      <smart-modal [open]="true" [title]="options().title" [description]="options().message ?? options().text ?? ''"
        [tone]="tone()" [headerIcon]="icon()" [showClose]="false"
        [closable]="!busy() || !!options().cancellationSafe" (closed)="cancel()">
        @if (options().reason) {
          <smart-form-field class="reason-field" [forId]="reasonId" label="Reason"
            [required]="options().reason === 'required'" [errors]="reasonErrors()">
            <textarea class="smart-input" [id]="reasonId" [formControl]="reason" [readonly]="busy()" rows="4"
              [attr.aria-required]="options().reason === 'required'"
              [attr.aria-invalid]="reasonErrors().length > 0"
              [attr.aria-describedby]="reasonErrors().length ? reasonId + '-error' : null"></textarea>
          </smart-form-field>
        }
        @if (options().typedText) {
          <smart-textbox label="Confirmation text" [hint]="'Type ' + options().typedText + ' to continue.'"
            [formControl]="typed" [readonly]="busy()" />
        }
        @if (validationError()) { <p class="dialog-error" role="alert">{{ validationError() }}</p> }
        @if (failure()) { <p class="dialog-error" role="alert">{{ failure() }}</p> }
        <div modalFooter class="smart-actions" data-placement="dialog">
          <button iamButton type="button" data-initial-focus [disabled]="busy() && !options().cancellationSafe" (click)="cancel()">
            {{ options().secondaryLabel ?? 'Cancel' }}
          </button>
          <button iamButton type="button" [variant]="variant()" emphasis="solid" [loading]="busy()"
            [attr.aria-label]="failure() ? 'Retry' : options().primaryLabel ?? options().okLabel ?? 'Confirm'" (click)="confirm()">
            <span class="button-content" [class.busy]="busy()">
              <iam-icon [name]="icon()" [size]="18" />{{ failure() ? 'Retry' : options().primaryLabel ?? options().okLabel ?? 'Confirm' }}
            </span>
            @if (busy()) { <iam-icon class="button-spinner" name="LoaderCircle" [size]="18" /> }
          </button>
        </div>
      </smart-modal>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartConfirmDialog implements OnDestroy {
    readonly options = input.required<ConfirmOptions>();
    readonly completed = output<ConfirmResult>();
    readonly reason = new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) });
    readonly typed = new FormControl('', { nonNullable: true });
    readonly busy = signal(false);
    readonly failure = signal('');
    readonly validationError = signal('');
    readonly reasonId = `dialog-reason-${++nextReason}`;
    private submitted = false;
    readonly reasonErrors = signal<readonly string[]>([]);
    readonly tone = computed<FeedbackTone>(() => this.options().tone ?? (['reject', 'delete', 'remove', 'unsaved', 'logout'].includes(this.options().kind ?? '') ? 'error' : this.options().kind === 'withdraw' ? 'warning' : this.options().kind === 'approve' ? 'success' : 'info'));
    readonly variant = computed<ButtonVariant>(() => this.options().okVariant ?? (['reject', 'delete', 'remove', 'unsaved', 'logout'].includes(this.options().kind ?? '') ? 'danger' : this.options().kind === 'approve' ? 'success' : this.options().kind === 'withdraw' ? 'warning' : 'primary'));
    readonly icon = computed<IconName>(() => ['delete', 'remove'].includes(this.options().kind ?? '') ? 'Trash2' : ['reject', 'unsaved', 'logout'].includes(this.options().kind ?? '') ? 'X' : 'Check');
    constructor() { this.reason.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => { if (this.submitted) this.validateReason(); }); }
    private validateReason(): void {
        this.reasonErrors.set(this.options().reason === 'required' && !this.reason.value.trim() ? ["Enter a reason. It's saved in the audit trail."] : this.reason.value.length > 1000 ? ['Use 1,000 characters or fewer.'] : []);
    }

    private controller?: AbortController;
    private destroyed = false;
    private settled = false;
    cancel(): void { if (this.settled || (this.busy() && !this.options().cancellationSafe))
        return; this.controller?.abort(); this.settled = true; this.completed.emit({ confirmed: false }); }
    async confirm(): Promise<void> {
        if (this.busy() || this.settled)
            return;
        this.submitted = true;
        this.validateReason();
        this.validationError.set('');
        if ((this.options().reason === 'required' && !this.reason.value.trim()) || this.reason.invalid || (this.options().typedText && this.typed.value !== this.options().typedText)) {
            if (this.options().typedText && this.typed.value !== this.options().typedText) this.validationError.set('Enter the matching confirmation text to continue.');
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
