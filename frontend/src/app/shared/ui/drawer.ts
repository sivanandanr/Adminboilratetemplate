import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, effect, inject, input, output, signal } from '@angular/core';
import { Button } from '../button';
import { ModalScrollLock } from './modal';
let nextDrawer = 0;
@Component({ selector: 'smart-drawer', imports: [Button], template: `<dialog #dialog [attr.aria-labelledby]="id" (cancel)="$event.preventDefault(); closed.emit()" (click)="backdrop($event)"><header><h2 [id]="id">{{ title() }}</h2><button iamButton type="button" (click)="closed.emit()" aria-label="Close drawer">Close</button></header><ng-content /></dialog>`, styles: `dialog { position:fixed; inset:0 0 0 auto; margin:0; width:min(480px,100vw); max-width:100vw; height:100dvh; max-height:100dvh; padding:var(--iam-space-5); color:var(--iam-text); background:var(--iam-surface); border:1px solid var(--iam-border); box-shadow:var(--iam-shadow); overflow:auto; }dialog::backdrop { background:var(--iam-backdrop); }header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }h2 { margin:0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDrawer implements AfterViewInit, OnDestroy {
 readonly id = `smart-drawer-${++nextDrawer}`; readonly title = input.required<string>(); readonly open = input(false); readonly closed = output<void>(); private readonly ready = signal(false); private previousFocus: HTMLElement | null = null; private readonly lock=inject(ModalScrollLock); private release?:()=>void;
 @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
 constructor() { effect(() => { if (!this.ready()) return; const dialog = this.dialog!.nativeElement; if (this.open() && !dialog.open) { this.previousFocus = document.activeElement as HTMLElement; this.release=this.lock.acquire(); dialog.showModal(); } else if (!this.open() && dialog.open) this.close(); }); }
 ngAfterViewInit(): void { this.ready.set(true); }
 backdrop(event: MouseEvent): void { if (event.target !== this.dialog?.nativeElement) return; const rect = this.dialog.nativeElement.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.closed.emit(); }
 private close(): void { this.dialog?.nativeElement.close(); this.release?.(); this.release=undefined; if (this.previousFocus?.isConnected) this.previousFocus.focus(); this.previousFocus = null; }
 ngOnDestroy(): void { this.close(); }
}
