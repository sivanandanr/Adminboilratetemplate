import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Observable, of, switchMap, timer } from 'rxjs';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
import { Button } from '../button';

export interface SmartSearchRequest { readonly query: string; readonly limit: number; readonly cursor?: string; }
export interface SmartSearchResult<T> { readonly items: readonly T[]; readonly nextCursor?: string; }
/** Implement remote paging here; the generic UI never calls HttpClient directly. */
export interface SmartDataProvider<T> { search(request: SmartSearchRequest): Observable<SmartSearchResult<T>>; }
export interface SmartOption { readonly value: string; readonly label: string; readonly disabled?: boolean; }

@Component({ selector: 'smart-autocomplete', imports: [SmartFormField, Button], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `
 <smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()">
 <div class="autocomplete" (keydown.escape)="close()"><div class="smart-input-row"><input class="smart-input" role="combobox" autocomplete="off" [id]="field.id()" [attr.aria-expanded]="expanded()" [attr.aria-controls]="field.id() + '-list'" aria-autocomplete="list" aria-haspopup="listbox" [attr.aria-activedescendant]="expanded() && active() >= 0 ? field.id() + '-option-' + active() : null" [attr.aria-describedby]="field.describedBy()" [attr.aria-invalid]="field.invalid()" [attr.aria-required]="field.required()" [disabled]="field.isDisabled()" [readonly]="field.readonly()" [placeholder]="field.placeholder()" [value]="text()" (input)="search($event)" (focus)="open()" (keydown)="keydown($event)" (blur)="blur()" />
 <button iamButton type="button" [disabled]="field.isDisabled() || field.readonly()" [attr.aria-label]="'Clear ' + field.label()" (click)="clear()">Clear</button></div>
 @if (multiple()) { <div role="group" [attr.aria-label]="field.label() + ' selected values'">@for (value of selected(); track value) { <span class="smart-chip">{{ labelFor(value) }}<button type="button" class="icon-button" [disabled]="field.isDisabled() || field.readonly()" [attr.aria-label]="'Remove ' + labelFor(value)" (click)="remove(value)">×</button></span> }</div> }
 @if (expanded()) { <div class="smart-popover"><ul role="listbox" [id]="field.id() + '-list'" [attr.aria-label]="field.label() + ' suggestions'" [attr.aria-multiselectable]="multiple() || null" [attr.aria-busy]="loading()">
 @for (option of results(); track key(option); let index = $index) { <li role="option" class="smart-option" [id]="field.id() + '-option-' + index" [class.is-active]="index === active()" [attr.aria-selected]="selected().includes(key(option))" [attr.aria-disabled]="isDisabled(option)" (pointerdown)="$event.preventDefault()" (click)="choose(option)">{{ display(option) }}</li> }</ul>
 @if (loading()) { <p role="status">Loading suggestions…</p> }
 @else if (failure()) { <p role="alert">Unable to load suggestions.</p><button iamButton type="button" (click)="retrySearch()">Retry search</button> }
 @else if (query() !== '*' && query().length < minLength()) { <p role="status">Enter at least {{ minLength() }} characters.</p> }
 @else if (!results().length) { <p role="status">No results found.</p> }
 @if (nextCursor() && !loading() && results().length < 100) { <button iamButton type="button" (click)="loadMore()">Load more suggestions</button> }
 @if (results().length >= 100) { <p role="status">Refine your search to see more results.</p> }</div> }
 </div></smart-form-field>`, styles: `.autocomplete { position:relative; }ul { list-style:none; padding:0; margin:0; }p { padding:8px; margin:0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartAutocomplete<T extends object = SmartOption> {
 readonly field = inject<SmartValueAccessor<string | readonly string[]>>(SmartValueAccessor);
 private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
 readonly items = input<readonly T[]>([]); readonly provider = input<SmartDataProvider<T> | null>(null);
 readonly displayField = input<keyof T | string>('label'); readonly valueField = input<keyof T | string>('value');
 readonly disabledField = input<keyof T | string>('disabled'); readonly multiple = input(false);
 readonly minLength = input(0); readonly debounceMs = input(250); readonly pageSize = input(25);
 /** Labels for values restored by a form before their remote page has loaded. */
 readonly selectedLabels = input<Readonly<Record<string, string>>>({});
 readonly selection = input<string | readonly string[] | null | undefined>(undefined);
 readonly selectionChanged = output<string | readonly string[] | null>();
 readonly blurred = output<void>();
 readonly query = signal(''); readonly expanded = signal(false); readonly results = signal<readonly T[]>([]);
 readonly loading = signal(false); readonly failure = signal(false); readonly active = signal(-1);
 readonly retry = signal(0); readonly nextCursor = signal<string | undefined>(undefined);
 private readonly cursor = signal<string | undefined>(undefined);
 private readonly labels = new Map<string, string>();
 readonly selected = computed<readonly string[]>(() => { const value = this.field.value(); return typeof value === 'string' ? [value] : value ?? []; });
 readonly text = computed(() => this.expanded() || this.multiple() ? this.query() : this.selected().length ? this.labelFor(this.selected()[0]) : '');
 constructor() {
  effect(() => { const value = this.selection(); if (value !== undefined) this.field.writeValue(value); });
  effect(onCleanup => {
   const query = this.query(); const cursor = this.cursor(); const retry = this.retry(); void retry;
   const provider = this.provider(); const items = this.items(); const min = this.minLength(); const limit = Math.max(1, Math.min(50, this.pageSize())); const delay = this.debounceMs();
   const displayField = this.displayField(); const valueField = this.valueField(); void displayField; void valueField;
   if (this.field.isDisabled() || this.field.readonly()) { this.close(); this.loading.set(false); return; }
   if (!this.expanded()) { this.loading.set(false); return; }
   this.failure.set(false); this.active.set(-1);
   if (!cursor) this.results.set([]);
   if (query !== '*' && query.length < min) { this.loading.set(false); this.nextCursor.set(undefined); return; }
   this.loading.set(true);
   const source: Observable<SmartSearchResult<T>> = provider ? timer(Math.max(0, delay)).pipe(switchMap(() => provider.search({ query: query === '*' ? '' : query, limit, cursor }))) : of(this.localPage(items, query, limit, cursor));
   const subscription = source.subscribe({ next: (result: SmartSearchResult<T>) => {
    const previous = cursor ? untracked(this.results) : [];
    const merged = [...previous, ...result.items].filter((item, index, all) => all.findIndex(candidate => this.key(candidate) === this.key(item)) === index).slice(0, 100);
    const selected = untracked(this.selected); for (const key of this.labels.keys()) if (!selected.includes(key)) this.labels.delete(key);
    for (const item of merged) this.labels.set(this.key(item), this.display(item));
    this.results.set(merged); this.nextCursor.set(result.nextCursor); this.loading.set(false);
   }, error: () => { this.failure.set(true); this.loading.set(false); } });
   onCleanup(() => subscription.unsubscribe());
  });
 }
 private localPage(items: readonly T[], query: string, limit: number, cursor?: string): SmartSearchResult<T> {
  const matches = items.filter(item => query === '*' || this.display(item).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const start = Number(cursor ?? 0);
  return { items: matches.slice(start, start + limit), nextCursor: start + limit < matches.length ? String(start + limit) : undefined };
 }
 private commit(value: string | readonly string[] | null): void { this.field.commit(value); this.selectionChanged.emit(value); }
 key(item: T): string { return String((item as Record<string, unknown>)[String(this.valueField())] ?? ''); }
 display(item: T): string { return String((item as Record<string, unknown>)[String(this.displayField())] ?? ''); }
 isDisabled(item: T): boolean { return (item as Record<string, unknown>)[String(this.disabledField())] === true; }
 labelFor(value: string): string { const item = this.items().find(item => this.key(item) === value) ?? this.results().find(item => this.key(item) === value); return this.selectedLabels()[value] ?? (item ? this.display(item) : this.labels.get(value)) ?? value; }
 open(): void { if (!this.field.isDisabled() && !this.field.readonly()) this.expanded.set(true); }
 search(event: Event): void { if (this.field.isDisabled() || this.field.readonly()) return; this.cursor.set(undefined); this.query.set((event.target as HTMLInputElement).value); this.open(); }
 choose(item: T): void { if (this.isDisabled(item) || this.field.isDisabled() || this.field.readonly()) return; const key = this.key(item); this.labels.set(key, this.display(item)); this.commit(this.multiple() ? this.selected().includes(key) ? this.selected().filter(value => value !== key) : [...this.selected(), key] : key); this.blur(); if (!this.multiple()) this.close(); }
 clear(): void { if (this.field.isDisabled() || this.field.readonly()) return; this.commit(this.multiple() ? [] : null); this.query.set(''); this.cursor.set(undefined); this.blur(); }
 remove(value: string): void { if (this.field.isDisabled() || this.field.readonly()) return; this.commit(this.selected().filter(item => item !== value)); this.blur(); this.element.nativeElement.querySelector<HTMLInputElement>('input')?.focus(); }
 close(): void { this.expanded.set(false); this.query.set(''); this.cursor.set(undefined); this.active.set(-1); }
 blur(): void { this.field.blur(); this.blurred.emit(); }
 @HostListener('document:pointerdown', ['$event']) outside(event: PointerEvent): void { if (!this.element.nativeElement.contains(event.target as Node)) this.close(); }
 @HostListener('focusout', ['$event']) focusout(event: FocusEvent): void { if (!this.element.nativeElement.contains(event.relatedTarget as Node | null)) this.close(); }
 retrySearch(): void { this.element.nativeElement.querySelector('input')?.focus(); this.retry.update(value => value + 1); }
 loadMore(): void { if (this.loading()) return; this.element.nativeElement.querySelector('input')?.focus(); this.cursor.set(this.nextCursor()); }
 keydown(event: KeyboardEvent): void {
  if (this.field.isDisabled() || this.field.readonly()) return;
  if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
  if (event.key === 'Tab') return;
  if (event.key === 'Enter' && this.expanded()) { event.preventDefault(); if (this.active() >= 0) this.choose(this.results()[this.active()]); return; }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || ((event.key === 'Home' || event.key === 'End') && !this.expanded())) return;
  event.preventDefault(); this.open(); const options = this.results(); if (!options.length) return;
  const direction = event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
  let index = event.key === 'Home' ? -1 : event.key === 'End' ? options.length : this.active();
  for (let count = 0; count < options.length; count++) { index = (index + direction + options.length) % options.length; if (!this.isDisabled(options[index])) { this.active.set(index); queueMicrotask(() => this.element.nativeElement.querySelectorAll<HTMLElement>('[role=option]')[index]?.scrollIntoView({ block: 'nearest' })); return; } }
 }
}
