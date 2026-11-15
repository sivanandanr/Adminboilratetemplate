import { Directive, ElementRef, HostListener, OnDestroy, Renderer2, inject, input } from '@angular/core';
let nextTooltip = 0;
/** Text-only hoverable, dismissible tooltip. Attach to a focusable trigger. */
@Directive({ selector: '[smartTooltip]' })
export class SmartTooltip implements OnDestroy {
 readonly smartTooltip = input.required<string>();
 private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
 private readonly renderer = inject(Renderer2);
 private readonly id = `smart-tooltip-${++nextTooltip}`;
 private tooltip?: HTMLElement;
 private oldDescription: string | null = null;
 private focused = false; private hovered = false; private tipHovered = false;
 private timer?: ReturnType<typeof setTimeout>;
 private unlisten: (() => void)[] = [];
 @HostListener('mouseenter') enter(): void { this.hovered = true; this.show(); }
 @HostListener('focusin') focus(): void { this.focused = true; this.show(); }
 @HostListener('mouseleave') leave(): void { this.hovered = false; this.scheduleHide(); }
 @HostListener('focusout') blur(): void { this.focused = false; this.scheduleHide(); }
 private show(): void {
  clearTimeout(this.timer); if (this.tooltip || !this.smartTooltip()) return;
  const trigger = this.trigger(); const tip = this.renderer.createElement('span') as HTMLElement;
  tip.id = this.id; tip.role = 'tooltip'; tip.textContent = this.smartTooltip();
  Object.assign(tip.style, { position:'fixed', zIndex:'100', maxWidth:'min(280px, calc(100vw - 16px))', padding:'8px', border:'1px solid var(--iam-control-border)', borderRadius:'var(--iam-radius-md)', background:'var(--iam-surface)', color:'var(--iam-text)', boxShadow:'var(--iam-shadow)' });
  this.renderer.appendChild(document.body, tip);
  this.oldDescription = trigger.getAttribute('aria-describedby'); trigger.setAttribute('aria-describedby', [this.oldDescription, this.id].filter(Boolean).join(' ')); this.tooltip = tip; this.position();
  this.unlisten = [this.renderer.listen(tip,'mouseenter',() => { this.tipHovered = true; clearTimeout(this.timer); }), this.renderer.listen(tip,'mouseleave',() => { this.tipHovered = false; this.scheduleHide(); })];
 }
 private scheduleHide(): void { clearTimeout(this.timer); this.timer = setTimeout(() => { if (!this.focused && !this.hovered && !this.tipHovered) this.hide(); }, 150); }
 private trigger(): HTMLElement { const host = this.element.nativeElement; return host.matches('button,a,input,select,textarea,[tabindex]') ? host : host.querySelector<HTMLElement>('button,a,input,select,textarea,[tabindex]') ?? host; }
 @HostListener('window:scroll') @HostListener('window:resize') position(): void { const tip = this.tooltip; if (!tip) return; const rect = this.trigger().getBoundingClientRect(); tip.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - tip.offsetWidth - 8))}px`; tip.style.top = `${Math.max(8, Math.min(rect.bottom + 6, innerHeight - tip.offsetHeight - 8))}px`; }
 @HostListener('document:keydown.escape') hide(): void {
  clearTimeout(this.timer); if (!this.tooltip) return;
  this.unlisten.forEach(stop => stop()); this.unlisten = []; this.tooltip.remove(); this.tooltip = undefined; this.tipHovered = false;
  if (this.oldDescription === null) this.trigger().removeAttribute('aria-describedby'); else this.trigger().setAttribute('aria-describedby', this.oldDescription);
 }
 ngOnDestroy(): void { this.hide(); }
}
