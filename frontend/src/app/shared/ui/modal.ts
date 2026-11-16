import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injectable, OnDestroy, ViewChild, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Icon, IconName } from '../icon';
import { FeedbackTone } from '../../core/feedback/toast.service';
import { SmartFeedbackIcon } from './feedback-icon';
import { SmartSpinner } from './progress';
/** Reference-counted lock allows drawers and modals to overlap without releasing scrolling early. */
@Injectable({ providedIn: 'root' })
export class ModalScrollLock {
    private count = 0;
    private previous = '';
    private content: HTMLElement | null = null;
    private previousContentOverflow = '';
    acquire(): () => void { if (this.count++ === 0) {
        this.previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.content = document.getElementById('main-content');
        this.previousContentOverflow = this.content?.style.overflow ?? '';
        if (this.content) this.content.style.overflow = 'hidden';
    } let released = false; return () => { if (released)
        return; released = true; if (--this.count === 0) {
        document.body.style.overflow = this.previous;
        if (this.content) this.content.style.overflow = this.previousContentOverflow;
        this.content = null;
      } }; }
}
/** FIFO ownership keeps directly composed modals and service dialogs on one implementation. */
@Injectable({ providedIn: 'root' })
export class ModalQueue {
    private readonly waiting = signal<readonly SmartModal[]>([]);
    readonly active = () => [...this.waiting()].sort((left, right) => right.priority() - left.priority())[0];
    originFor(element: HTMLElement | null, requester: SmartModal): HTMLElement | null {
        const owner = this.waiting().find(modal => modal !== requester && modal.containsFocus(element));
        return owner?.focusOrigin() ?? element;
    }
    request(modal: SmartModal): void { if (!this.waiting().includes(modal)) this.waiting.update(items => [...items, modal]); }
    release(modal: SmartModal): void { this.waiting.update(items => items.filter(item => item !== modal)); }
}
let nextModal = 0;
@Component({ selector: 'smart-modal', imports: [Icon, SmartFeedbackIcon, SmartSpinner], template: `
 <dialog #dialog [class.drawer]="presentation() === 'drawer'" [style.z-index]="priority() >= 100 ? 'var(--iam-layer-block)' : 'var(--iam-layer-dialog)'" tabindex="-1" (focusin)="rememberFocus($event)" (keydown.tab)="trap($event)" [attr.role]="dialogRole()" [attr.aria-busy]="busy() || null" [attr.aria-labelledby]="id" [attr.aria-describedby]="description() ? id + '-description' : null" (cancel)="$event.preventDefault(); requestClose()" (click)="backdrop($event)">
 <header>@if (busy()) { <smart-spinner label="Waiting for the server" [size]="22" /> }@else { <smart-feedback-icon [tone]="tone()" [name]="headerIcon()" /> }<h2 [id]="id">{{ title() }}</h2>@if (closable() && showClose()) { <button class="modal-close" type="button" aria-label="Close dialog" (click)="requestClose()"><iam-icon name="X" [size]="18" /></button> }</header>
 <div class="modal-body">@if (description()) { <p [id]="id + '-description'">{{ description() }}</p> }<ng-content /></div>
 <footer><ng-content select="[modalFooter]" /></footer>
 </dialog>`, styles: `
    dialog { width:min(var(--iam-dialog-width),calc(100vw - 32px)); max-height:85dvh; margin:auto; padding:0;
      border:0; border-radius:var(--iam-dialog-radius); background:var(--iam-feedback-surface);
      color:var(--iam-feedback-title); box-shadow:var(--iam-feedback-shadow); overflow:hidden; }
    dialog:focus { outline:none; }
    dialog[open] { display:flex; flex-direction:column; }
    dialog::backdrop { background:var(--iam-backdrop); }
    header { display:flex; flex-shrink:0; align-items:center; gap:12px; padding:20px 20px 12px; }
    h2 { margin:0; min-width:0; overflow-wrap:anywhere; font-size:var(--iam-font-lg); font-weight:700; line-height:24px; }
    .modal-close { display:inline-flex; align-items:center; justify-content:center; margin-left:auto; padding:0;
      width:28px; height:28px; border:0; border-radius:var(--iam-radius-sm); background:transparent; color:var(--iam-feedback-muted); flex-shrink:0; }
    .modal-close:hover { background:var(--iam-hover); color:var(--iam-feedback-title); }
    .modal-body { padding:0 20px 16px; min-height:0; overflow:auto; overscroll-behavior:contain; }
    p { margin:0 0 12px; color:var(--iam-feedback-muted); font-size:var(--iam-font-md); line-height:17px; overflow-wrap:anywhere; }
    footer { flex-shrink:0; border-top:1px solid var(--iam-feedback-border); padding:14px 20px; }
    footer:empty { display:none; }
    dialog.drawer{inset:0 0 0 auto;margin:0;width:min(480px,100vw);max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0;}
    .drawer header{padding:var(--iam-space-5);border-bottom:1px solid var(--iam-feedback-border);}
    .drawer .modal-body{flex:1;padding:var(--iam-space-5);}
    .drawer footer{padding:var(--iam-space-4) var(--iam-space-5);}
    @media(max-width:767px){dialog.drawer{width:100vw;}}

  `, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartModal implements AfterViewInit, OnDestroy {
    readonly presentation = input<'dialog' | 'drawer'>('dialog');
    readonly id = `smart-modal-${++nextModal}`;
    readonly title = input.required<string>();
    readonly description = input('');
    readonly tone = input<FeedbackTone>('info');
    readonly headerIcon = input<IconName | null>(null);
    readonly showClose = input(true);
    readonly busy = input(false);
    readonly dialogRole = input<'dialog' | 'alertdialog'>('dialog');
    readonly priority = input(0);
    readonly open = input(false);
    readonly closable = input(true);
    readonly closed = output<void>();
    private readonly ready = signal(false);
    private readonly lock = inject(ModalScrollLock);
    private release?: () => void;
    private previousFocus: HTMLElement | null = null;
    private resumeFocus: HTMLElement | null = null;
    private insideFocus: HTMLElement | null = null;
    @ViewChild('dialog')
    private dialog?: ElementRef<HTMLDialogElement>;
    private readonly queue = inject(ModalQueue);
    constructor() {
        effect(() => {
            const requested = this.ready() && this.open();
            untracked(() => { if (requested) this.queue.request(this); else this.queue.release(this); });
        });
        effect(() => {
            if (!this.ready()) return;
            const dialog = this.dialog!.nativeElement;
            if (this.open() && this.queue.active() === this && !dialog.open) {
                this.previousFocus ??= this.queue.originFor(document.activeElement as HTMLElement, this);
                this.release = this.lock.acquire();
                dialog.showModal();
                queueMicrotask(() => { if (dialog.open) { const focus = this.resumeFocus?.isConnected ? this.resumeFocus : dialog.querySelector<HTMLElement>('[data-initial-focus]'); focus?.focus(); this.resumeFocus = null; } });
            } else if (!this.open()) this.close();
            else if (this.queue.active() !== this && dialog.open) {
                const active = document.activeElement as HTMLElement;
                this.resumeFocus = dialog.contains(active) ? active : this.insideFocus;
                dialog.close(); this.release?.(); this.release = undefined;
            }
        });
    }
    containsFocus(element: HTMLElement | null): boolean { return !!element && !!this.dialog?.nativeElement.contains(element); }
    focusOrigin(): HTMLElement | null { return this.previousFocus; }
    rememberFocus(event: FocusEvent): void { if (event.target instanceof HTMLElement) this.insideFocus = event.target; }
    trap(event: Event): void { if (!(event instanceof KeyboardEvent) || event.key !== 'Tab')
        return; const dialog = this.dialog?.nativeElement; if (!dialog)
        return; const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]')); if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
    } const first = elements[0], last = elements[elements.length - 1]; if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
    }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault();
        first.focus();
    } }
    ngAfterViewInit(): void { this.ready.set(true); }
    requestClose(): void { if (this.closable())
        this.closed.emit(); }
    backdrop(event: MouseEvent): void { if (event.target !== this.dialog?.nativeElement)
        return; const rect = this.dialog.nativeElement.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
        this.requestClose(); }
    private close(): void { this.dialog?.nativeElement.close(); this.release?.(); this.release = undefined; if (this.previousFocus?.isConnected)
        this.previousFocus.focus(); this.previousFocus = null; this.insideFocus = null; this.resumeFocus = null; }
    ngOnDestroy(): void { this.close(); this.queue.release(this); }
}
