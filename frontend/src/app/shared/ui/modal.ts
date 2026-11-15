import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injectable, OnDestroy, ViewChild, effect, inject, input, output, signal } from '@angular/core';
import { Button } from '../button';
/** Reference-counted lock allows drawers and modals to overlap without releasing scrolling early. */
@Injectable({ providedIn: 'root' })
export class ModalScrollLock {
    private count = 0;
    private previous = '';
    acquire(): () => void { if (this.count++ === 0) {
        this.previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    } let released = false; return () => { if (released)
        return; released = true; if (--this.count === 0)
        document.body.style.overflow = this.previous; }; }
}
let nextModal = 0;
@Component({ selector: 'smart-modal', imports: [Button], template: `
 <dialog #dialog tabindex="-1" (keydown.tab)="trap($event)" [attr.aria-labelledby]="id" [attr.aria-describedby]="description() ? id + '-description' : null" (cancel)="$event.preventDefault(); requestClose()" (click)="backdrop($event)">
 <header><h2 [id]="id">{{ title() }}</h2>@if (closable()) { <button iamButton type="button" aria-label="Close dialog" (click)="requestClose()">Close</button> }</header>
 @if (description()) { <p [id]="id + '-description'">{{ description() }}</p> }<ng-content />
 </dialog>`, styles: `dialog { width:min(560px,calc(100vw - 32px)); max-height:calc(100dvh - 32px); margin:auto; padding:var(--iam-space-5); border:1px solid var(--iam-control-border); border-radius:var(--iam-radius-lg); background:var(--iam-surface); color:var(--iam-text); box-shadow:var(--iam-shadow); overflow:auto; }dialog::backdrop { background:var(--iam-backdrop); }header { display:flex; align-items:center; justify-content:space-between; gap:16px; }h2 { margin:0; }p { margin:16px 0; overflow-wrap:anywhere; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartModal implements AfterViewInit, OnDestroy {
    readonly id = `smart-modal-${++nextModal}`;
    readonly title = input.required<string>();
    readonly description = input('');
    readonly open = input(false);
    readonly closable = input(true);
    readonly closed = output<void>();
    private readonly ready = signal(false);
    private readonly lock = inject(ModalScrollLock);
    private release?: () => void;
    private previousFocus: HTMLElement | null = null;
    @ViewChild('dialog')
    private dialog?: ElementRef<HTMLDialogElement>;
    constructor() { effect(() => { if (!this.ready())
        return; const dialog = this.dialog!.nativeElement; if (this.open() && !dialog.open) {
        this.previousFocus = document.activeElement as HTMLElement;
        this.release = this.lock.acquire();
        dialog.showModal();
        queueMicrotask(() => dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus());
    }
    else if (!this.open() && dialog.open)
        this.close(); }); }
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
        this.previousFocus.focus(); this.previousFocus = null; }
    ngOnDestroy(): void { this.close(); }
}
