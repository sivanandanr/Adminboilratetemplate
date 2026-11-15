import { componentExamples } from './component-examples';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, throwError, timer } from 'rxjs';
import { CanDirective } from '../../core/auth/can.directive';
import { SmartTextbox, SmartPassword, SmartTextarea, SmartNumberInput, SmartDropdown, SmartAutocomplete, SmartMultiSelect, SmartCheckbox, SmartRadioGroup, SmartToggle, SmartDatePicker, SmartDateRangePicker, SmartFileUpload, SmartFormSection, SmartFormField, SmartFieldError, SmartButton, SmartButtonGroup, SmartSplitButton, SmartActionToolbar, SmartCard, SmartBadge, SmartStatusIndicator, SmartTabs, SmartAccordion, SmartTooltip, SmartDivider, SmartEmptyState, SmartSkeleton, SmartLoadingOverlay, SmartPageHeader, SmartBreadcrumb, SmartDrawer, SmartOption, SmartDataProvider, SmartSearchRequest, SmartSearchResult, SmartDateRange, smartDateRangeValidator } from '../../shared/ui';

@Component({ selector: 'iam-components-showcase', imports: [ReactiveFormsModule, CanDirective, SmartTextbox, SmartPassword, SmartTextarea, SmartNumberInput, SmartDropdown, SmartAutocomplete, SmartMultiSelect, SmartCheckbox, SmartRadioGroup, SmartToggle, SmartDatePicker, SmartDateRangePicker, SmartFileUpload, SmartFormSection, SmartFormField, SmartFieldError, SmartButton, SmartButtonGroup, SmartSplitButton, SmartActionToolbar, SmartCard, SmartBadge, SmartStatusIndicator, SmartTabs, SmartAccordion, SmartTooltip, SmartDivider, SmartEmptyState, SmartSkeleton, SmartLoadingOverlay, SmartPageHeader, SmartBreadcrumb, SmartDrawer], templateUrl: './components-showcase.html', styles: `:host { display:block; }.showcase { display:grid; gap:var(--iam-space-4); }.examples { display:flex; flex-wrap:wrap; align-items:center; gap:12px; }.state-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:16px; }pre { overflow:auto; padding:12px; border:1px solid var(--iam-border); background:var(--iam-control-fill); border-radius:var(--iam-radius-md); font-size:12px; white-space:pre-wrap; overflow-wrap:anywhere; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ComponentsShowcase {
 readonly usageExamples = componentExamples;
 readonly options: readonly SmartOption[] = [{ value:'admin', label:'Administrator' }, { value:'reader', label:'Reader' }, { value:'owner', label:'Application owner' }, { value:'locked', label:'Unavailable role', disabled:true }];
 readonly form = new FormGroup({ name:new FormControl('', { nonNullable:true, validators:[Validators.required, Validators.minLength(3)] }), password:new FormControl('', { nonNullable:true, validators:[Validators.required, Validators.minLength(8)] }), description:new FormControl(''), number:new FormControl<number | null>(5, [Validators.min(1), Validators.max(100)]), role:new FormControl<string | null>(null, Validators.required), owner:new FormControl<string | readonly string[] | null>(null), remote:new FormControl<string | readonly string[] | null>(null), owners:new FormControl<string | readonly string[] | null>([]), roles:new FormControl<readonly string[]>([]), accepted:new FormControl(false, {nonNullable:true,validators:Validators.requiredTrue}), security:new FormControl('reader'), enabled:new FormControl(false, {nonNullable:true}), date:new FormControl<string | null>(null), range:new FormControl<SmartDateRange | null>(null, smartDateRangeValidator), files:new FormControl<readonly File[]>([]) });
 readonly state = signal<'default' | 'required' | 'disabled' | 'readonly' | 'error' | 'loading'>('default');
 readonly drawer = signal(false); readonly tab = signal('details'); readonly notice = signal(''); readonly overlay = signal(false); readonly failRemote = signal(false);
 readonly stateOptions = ['default','required','disabled','readonly','error','loading'] as const;
 readonly remoteProvider: SmartDataProvider<SmartOption> = { search:(request: SmartSearchRequest): Observable<SmartSearchResult<SmartOption>> => {
  if (this.failRemote()) return timer(300).pipe(() => throwError(() => new Error('Demonstration failure')));
  // Simulate a server page; never allocate a 10,000-row collection in the browser.
  const start = Number(request.cursor ?? '0');
  return timer(request.query === 'slow' ? 1200 : 350).pipe(map(() => ({ items:Array.from({length:request.limit}, (_, index) => ({value:`${request.query}-${start + index}`,label:`${request.query} user ${start + index + 1}`})), nextCursor:start + request.limit < 10_000 ? String(start + request.limit) : undefined })));
 } };
 readonly confirmToggle = async (next: boolean): Promise<boolean> => { this.notice.set(`Confirmation requested: ${next ? 'Yes' : 'No'}`); return this.confirmAllowed(); };
 readonly confirmAllowed = signal(true);
 readonly example = `<smart-textbox label="Display name" [formControl]="name" [required]="true" hint="Public display name" />\n// name = new FormControl('', { nonNullable: true, validators: Validators.required });`;
 readonly autocompleteExample = `<smart-autocomplete label="Owner" [formControl]="owner" [provider]="users" [minLength]="2" displayField="label" valueField="value" />\n// users: SmartDataProvider<SmartOption>; search returns Observable<SmartSearchResult<SmartOption>>.`;
 setState(value: string): void { this.state.set(value as typeof this.stateOptions[number]); if (value === 'disabled') this.form.disable(); else this.form.enable(); }
 save(): void { this.form.markAllAsTouched(); this.notice.set(this.form.valid ? 'Demo values accepted locally; nothing was persisted.' : 'Correct the highlighted fields.'); }
 reset(): void { this.form.reset(); this.notice.set('Form reset.'); }
 async copy(value: string): Promise<void> { try { await navigator.clipboard.writeText(value); this.notice.set('Usage example copied.'); } catch { this.notice.set('Copy unavailable. Select and copy the example text.'); } }
}
