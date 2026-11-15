import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({ selector: 'smart-accordion', template: `<details class="panel" [open]="expanded()"><summary>{{ title() }}</summary><div><ng-content /></div></details>`, styles: `summary { cursor:pointer; padding:var(--iam-space-4); font-weight:600; }details>div { padding:0 var(--iam-space-4) var(--iam-space-4); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartAccordion { readonly title = input.required<string>(); readonly expanded = input(false); }
