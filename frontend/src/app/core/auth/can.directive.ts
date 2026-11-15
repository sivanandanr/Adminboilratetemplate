import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { Permission } from './auth.models';

/** UI convenience only; every operation still requires server authorization. */
@Directive({ selector: '[iamCan]' })
export class CanDirective {
  readonly iamCan = input.required<Permission>();
  private readonly auth = inject(AuthFacade);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private rendered = false;
  constructor() {
    effect(() => {
      const allowed = this.auth.can(this.iamCan());
      if (allowed && !this.rendered) { this.container.createEmbeddedView(this.template); this.rendered = true; }
      else if (!allowed && this.rendered) { this.container.clear(); this.rendered = false; }
    });
  }
}
