import { Directive, ElementRef, Injectable, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { SmartTooltip } from './ui/tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonEmphasis = 'auto' | 'solid' | 'outline';
/** Scoped to a shared action group: the first requested main action owns the solid emphasis. */
@Injectable()
export class ButtonGroupState {
  private readonly members = signal<readonly Button[]>([]);
  register(button: Button): () => void {
    this.members.update(items => [...items, button]);
    return () => this.members.update(items => items.filter(item => item !== button));
  }
  allowsSolid(button: Button): boolean { return this.members().find(item => item.requestsSolid()) === button; }
}

/** Native semantics remain unchanged unless a disabled reason must stay keyboard-discoverable. */
@Directive({
  selector: 'button[iamButton]',
  hostDirectives: [{ directive: SmartTooltip, inputs: ['smartTooltip'] }],
  host: {
    class: 'button',
    '[class.button-primary]': 'variant() === "primary" && solid()',
    '[class.button-outline]': 'variant() === "outline" || (variant() === "primary" && !solid())',
    '[class.button-ghost]': 'variant() === "ghost"',
    '[class.button-danger]': 'variant() === "danger"',
    '[class.button-success]': 'variant() === "success"',
    '[class.button-warning]': 'variant() === "warning"',
    '[class.button-solid]': 'solid()',
    '[class.button-small]': 'size() === "small"',
    '[class.button-large]': 'size() === "large"',
    '[disabled]': '(disabled() && !disabledReason()) || loading()',
    '[attr.aria-disabled]': 'disabled() || loading() || null',
    '[attr.aria-busy]': 'loading()',
    '[attr.title]': '(disabled() ? disabledReason() : "") || tooltip() || null',
  },
})
export class Button implements OnDestroy {
  readonly variant = input<ButtonVariant>('secondary');
  readonly emphasis = input<ButtonEmphasis>('auto');
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly tooltip = input('');
  readonly disabledReason = input('');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly requestsSolid = computed(() => this.emphasis() === 'solid' || (this.emphasis() === 'auto' && ['primary', 'success'].includes(this.variant())));
  private readonly group = inject(ButtonGroupState, { optional: true });
  readonly solid = computed(() => this.requestsSolid() && (!this.group || this.group.allowsSolid(this)));
  private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly tip = inject(SmartTooltip);
  private readonly unregister = this.group?.register(this);
  private originalMinWidth: string | undefined;
  private readonly blockUnavailable = (event: Event): void => {
    if (this.loading() || this.disabled()) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  constructor() {
    // Capture runs before Angular's coalesced template click listeners.
    this.element.nativeElement.addEventListener('click', this.blockUnavailable, true);
    this.tip.setFallback(() => (this.disabled() ? this.disabledReason() : '') || this.tooltip());
    effect(() => {
      const button = this.element.nativeElement;
      if (this.loading() && this.originalMinWidth === undefined) {
        this.originalMinWidth = button.style.minWidth;
        button.style.minWidth = `${button.getBoundingClientRect().width}px`;
      } else if (!this.loading() && this.originalMinWidth !== undefined) {
        button.style.minWidth = this.originalMinWidth;
        this.originalMinWidth = undefined;
      }
    });
  }
  ngOnDestroy(): void {
    this.element.nativeElement.removeEventListener('click', this.blockUnavailable, true);
    this.unregister?.();
  }
}
