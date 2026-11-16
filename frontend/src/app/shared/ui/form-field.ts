import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon';

@Component({ selector: 'smart-field-error', imports: [Icon], template: `@if (errors().length) { <div class="smart-errors" [id]="id()" role="alert">@for (error of errors(); track $index) { <p><iam-icon name="CircleAlert" [size]="14" /><span>{{ error }}</span></p> }</div> }`, styles:`iam-icon { flex:none; margin-top:1px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartFieldError { readonly id = input(''); readonly errors = input<readonly string[]>([]); }

@Component({ selector: 'smart-form-field', imports: [SmartFieldError], template: `
  @if (label()) { <label [id]="forId() + '-label'" [attr.for]="group() ? null : forId()">{{ label() }} @if (required()) { <span aria-hidden="true">*</span><span class="sr-only"> (required)</span> }</label> }
  <ng-content />
  @if (disabled() && disabledReason()) { <p class="smart-hint" [id]="forId() + '-disabled'">{{ disabledReason() }}</p> }
  @if (hint()) { <p class="smart-hint" [id]="forId() + '-hint'">{{ hint() }}</p> }
  <smart-field-error [id]="forId() + '-error'" [errors]="errors()" />`,
  styles: `:host { display:block; min-width:0; }label { display:block; font-weight:600; margin-bottom:var(--iam-space-1); }label>span:first-child { color:var(--iam-error-text); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartFormField { readonly group = input(false); readonly forId = input.required<string>(); readonly disabled = input(false); readonly disabledReason = input(''); readonly label = input(''); readonly hint = input(''); readonly required = input(false); readonly errors = input<readonly string[]>([]); }

@Component({ selector: 'smart-form-section', template: `<fieldset class="smart-section"><legend>{{ title() }}</legend>@if (description()) { <p>{{ description() }}</p> }<div class="smart-form-grid"><ng-content /></div></fieldset>`, styles:`fieldset > p { margin:0 0 var(--iam-space-4); color:var(--iam-text-secondary); font-size:var(--iam-font-sm); line-height:1.5; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartFormSection { readonly title = input.required<string>(); readonly description = input(''); }
