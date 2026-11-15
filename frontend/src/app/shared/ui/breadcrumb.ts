import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
export interface SmartCrumb { readonly label: string; readonly path?: string; }
@Component({ selector: 'smart-breadcrumb', imports: [RouterLink], template: `<nav [attr.aria-label]="label()"><ol>@for (crumb of items(); track $index; let last = $last) { <li>@if (crumb.path && !last) { <a [routerLink]="crumb.path">{{ crumb.label }}</a> }@else { <span [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span> }@if (!last) { <span aria-hidden="true">›</span> }</li> }</ol></nav>`, styles: `ol { display:flex; flex-wrap:wrap; gap:8px; padding:0; margin:0; list-style:none; }li { display:flex; gap:8px; }a { color:var(--iam-accent); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartBreadcrumb { readonly items = input.required<readonly SmartCrumb[]>(); readonly label = input('Breadcrumb'); }
