import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

@Component({
  selector: 'iam-page-header, smart-page-header',
  imports: [Icon],
  template: `
    <div class="page-heading">
      <div class="heading-copy">
        <span class="heading-icon"><iam-icon [name]="icon()" [size]="32" /></span>
        <div><div class="title-line"><h1>{{ title() }}</h1><ng-content select="[page-meta]" /></div><p>{{ description() }}</p></div>
      </div>
      <div class="page-actions"><ng-content select="[page-actions]" /></div>
    </div>
  `,
  styles: `
    :host { display: block; margin-bottom: var(--iam-space-4); }
    .page-heading { min-height: 56px; display: flex; align-items: center; justify-content: space-between; gap: var(--iam-space-4); }
    .heading-copy { display: flex; align-items: center; gap: var(--iam-space-4); min-width: 0; padding-left: var(--iam-space-3); }
    .heading-icon { display: grid; place-items: center; width: 56px; height: 56px; flex-shrink: 0; border-radius: var(--iam-radius-lg); color: var(--iam-accent); background: var(--iam-primary-soft); }
    .title-line { display: flex; align-items: center; flex-wrap: wrap; gap: var(--iam-space-2); }
    h1 { margin: 0; font-size: var(--iam-font-title); line-height: 1.2; font-weight: 700; letter-spacing: -.6px; }
    p { color: var(--iam-text-secondary); margin: 3px 0 0; }
    .page-actions { display: flex; align-items: center; gap: var(--iam-space-3); flex-shrink: 0; align-self: flex-end; max-width: 100%; padding-bottom: 2px; }
    @media (max-width: 1100px) { .page-heading { align-items: flex-start; flex-direction: column; }.page-actions { align-self: flex-end; } }
    @media (max-width: 767px) { h1 { font-size: 23px; }.heading-copy { align-items: flex-start; padding-left: 0; }.page-actions { align-self: stretch; flex-wrap: wrap; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName>('Settings');
}
