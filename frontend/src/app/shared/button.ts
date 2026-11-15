import { Directive, HostListener, input } from '@angular/core';

/** Native button semantics with typed variants and an explicit busy state. */
@Directive({
  selector: 'button[iamButton]',
  host: {
    class: 'button',
    '[class.button-primary]': 'variant() === "primary"',
    '[class.button-outline]': 'variant() === "outline"',
    '[class.button-ghost]': 'variant() === "ghost"',
    '[class.button-danger]': 'variant() === "danger"',
    '[class.button-small]': 'size() === "small"',
    '[class.button-large]': 'size() === "large"',
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading()',
    '[attr.title]': 'tooltip() || null',
  },
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>('secondary');
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly tooltip = input('');
  readonly loading = input(false);
  readonly disabled = input(false);

  @HostListener('click', ['$event']) protected preventBusyClick(event: Event): void {
    if (this.loading() || this.disabled()) event.stopImmediatePropagation();
  }
}
