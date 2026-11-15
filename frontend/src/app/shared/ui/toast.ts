import { ChangeDetectionStrategy, Component, ElementRef, afterEveryRender, inject, input, output } from '@angular/core';
import { ToastItem, ToastService } from '../../core/feedback/toast.service';
import { Button } from '../button';
import { Icon } from '../icon';
import { SmartFeedbackIcon } from './feedback-icon';
@Component({
    selector: 'smart-toast', imports: [Button, Icon, SmartFeedbackIcon],
    template: `
      <article class="toast" [attr.data-tone]="item().tone"
        [attr.role]="item().tone === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="item().tone === 'error' ? 'assertive' : 'polite'" aria-atomic="true"
        (mouseenter)="hover(true)" (mouseleave)="hover(false)"
        (focusin)="focus(true)" (focusout)="focusout($event)">
        <smart-feedback-icon [tone]="item().tone ?? 'info'" />
        <div class="toast-copy">
          <strong>{{ item().title }}</strong>
          @if (item().message) { <p>{{ item().message }}</p> }
          @if (item().action) {
            <button iamButton type="button" variant="ghost" class="toast-action" (click)="action.emit()">
              {{ item().action?.label }}<iam-icon name="ArrowRight" [size]="14" />
            </button>
          }
        </div>
        <button type="button" class="toast-close" [attr.aria-label]="'Dismiss ' + item().title" (click)="dismissed.emit()">
          <iam-icon name="X" [size]="18" />
        </button>
      </article>
    `,
    styles: `
      :host { display:block; min-width:0; }
      .toast { display:grid; grid-template-columns:34px minmax(0,1fr) 28px; align-items:start; gap:12px; padding:13px 14px;
        background:var(--iam-feedback-surface); color:var(--iam-toast-title); border:1px solid var(--iam-feedback-border);
        border-radius:var(--iam-toast-radius); box-shadow:var(--iam-feedback-shadow); overflow-wrap:anywhere; animation:toast-enter .15s ease-out; }
      .toast-copy { min-width:0; }
      strong { display:block; font-size:var(--iam-font-md); font-weight:700; line-height:18px; }
      p { margin:0; color:var(--iam-feedback-muted); font-size:var(--iam-font-md); line-height:17px; }
      .toast-close { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0;
        margin-top:0; border:0; border-radius:var(--iam-radius-sm); background:transparent; color:var(--iam-feedback-muted); box-shadow:none; }
      .toast-close:hover { color:var(--iam-feedback-title); background:var(--iam-hover); }
      .toast-action { min-height:28px; padding:4px 0 0; margin:0; font-size:var(--iam-font-sm); color:var(--iam-accent); }
      @keyframes toast-enter { from { transform:translateY(-8px); opacity:0; }to { transform:none; opacity:1; } }
      @media(prefers-reduced-motion:reduce) { .toast { animation:none; } }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartToast {
    readonly item = input.required<ToastItem>();
    readonly dismissed = output<void>();
    readonly paused = output<void>();
    readonly action = output<void>();
    readonly resumed = output<void>();
    private hovered = false;
    private focused = false;
    private isPaused = false;
    hover(value: boolean): void { this.hovered = value; this.updatePause(); }
    focus(value: boolean): void { this.focused = value; this.updatePause(); }
    focusout(event: FocusEvent): void { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) this.focus(false); }
    private updatePause(): void {
        const next = this.hovered || this.focused;
        if (next === this.isPaused) return;
        this.isPaused = next;
        if (next) this.paused.emit(); else this.resumed.emit();
    }
}
@Component({
    selector: 'smart-toast-container', imports: [SmartToast],
    template: `<aside popover="manual" aria-label="Application messages">
      @for (item of toasts.items(); track item.id) {
        <smart-toast [item]="item" (dismissed)="toasts.dismiss(item.id)" (paused)="toasts.pause(item.id)"
          (resumed)="toasts.resume(item.id)" (action)="toasts.action(item.id)" />
      }
    </aside>`,
    styles: `
      aside { position:fixed; inset:auto; margin:0; border:0; background:transparent; color:inherit; top:calc(var(--iam-header-height) + 22px); right:24px;
        width:min(var(--iam-toast-width),calc(100vw - 32px)); max-height:calc(100dvh - var(--iam-header-height) - 40px);
        overflow:auto; display:grid; gap:10px; z-index:var(--iam-layer-toast); padding:0 0 var(--iam-space-4); }
      aside:empty { display:none; }
      @media(max-width:760px) { aside { right:16px; } }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartToastContainer {
    readonly toasts = inject(ToastService);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private overlays: readonly Element[] = [];
    constructor() {
      afterEveryRender(() => {
        const aside=this.host.nativeElement.querySelector('aside')!;
        const overlays=Array.from(document.querySelectorAll('dialog[open],[popover]:popover-open')).filter(element=>element!==aside);
        const changed=overlays.length!==this.overlays.length || overlays.some((element,index)=>element!==this.overlays[index]);
        this.overlays=overlays;
        if(!this.toasts.items().length){if(aside.matches(':popover-open'))aside.hidePopover();return;}
        if(changed && aside.matches(':popover-open'))aside.hidePopover();
        if(!aside.matches(':popover-open'))aside.showPopover();
      });
    }
}
