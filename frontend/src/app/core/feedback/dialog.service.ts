import { Injectable, signal } from '@angular/core';
import { FeedbackTone } from './toast.service';
export type ConfirmationKind = 'confirm' | 'delete' | 'unsaved' | 'logout' | 'privileged';
export interface MessageBoxOptions {
    readonly title: string;
    readonly message: string;
    readonly tone?: FeedbackTone;
    readonly primaryLabel?: string;
    readonly secondaryLabel?: string;
}
export interface ConfirmationContext {
    readonly reason: string;
    readonly signal: AbortSignal;
}
export interface ConfirmOptions extends MessageBoxOptions {
    readonly kind?: ConfirmationKind;
    readonly reason?: 'optional' | 'required';
    readonly typedText?: string;
    readonly execute?: (context: ConfirmationContext) => Promise<void>;
    /** Only enable if the operation implements safe cancellation through AbortSignal. */
    readonly cancellationSafe?: boolean;
}
export interface ConfirmResult {
    readonly confirmed: boolean;
    readonly reason?: string;
}
export interface DialogRequest {
    readonly id: number;
    readonly type: 'message' | 'confirm';
    readonly options: ConfirmOptions;
    readonly resolve: (result: ConfirmResult) => void;
}
@Injectable({ providedIn: 'root' })
export class DialogService {
    private sequence = 0;
    private readonly queue = signal<readonly DialogRequest[]>([]);
    readonly requests = this.queue.asReadonly();
    message(options: MessageBoxOptions): Promise<ConfirmResult> { return this.enqueue('message', options); }
    confirm(options: ConfirmOptions): Promise<ConfirmResult> { return this.enqueue('confirm', options); }
    private enqueue(type: DialogRequest['type'], options: ConfirmOptions): Promise<ConfirmResult> { return new Promise(resolve => { this.queue.update(items => [...items, { id: ++this.sequence, type, options, resolve }]); }); }
    settle(id: number, result: ConfirmResult): void { const item = this.queue().find(item => item.id === id); if (!item)
        return; this.queue.update(items => items.filter(item => item.id !== id)); item.resolve(result); }
    cancelAll(): void { const items = this.queue(); this.queue.set([]); for (const item of items)
        item.resolve({ confirmed: false }); }
}
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
    constructor(private readonly dialogs: DialogService) { }
    confirm(options: ConfirmOptions): Promise<ConfirmResult> { return this.dialogs.confirm(options); }
}
