import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '../button';
import { FeedbackState } from '../feedback-state';
import { SmartSpinner } from '../ui/progress';
import { GridColumnPreference } from './grid-preferences.service';
@Component({ selector: 'smart-grid-toolbar', template: `<div class="toolbar"><h2>{{ title() }}</h2><div class="toolbar-actions" role="group" aria-label="Grid actions"><ng-content /></div></div>`, styles: `.toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }h2 { margin:0; }.toolbar-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridToolbarComponent {
    readonly title = input.required<string>();
}
@Component({ selector: 'smart-grid-pagination', imports: [Button], template: `<div class="pagination"><span role="status">{{ summary() }}</span><div class="controls"><label>Rows per page<select class="smart-input" [value]="pageSize()" [disabled]="disabled()" (change)="sizeChanged.emit(+$any($event.target).value)">@for(size of sizes();track size){<option [value]="size">{{ size }}</option>}</select></label><button iamButton type="button" aria-label="Previous page" [disabled]="disabled() || pageNumber() <= 1" (click)="pageChanged.emit(pageNumber()-1)">‹</button><span>Page {{ pageNumber() }}@if(totalCount()!==null){ of {{ pages() }} }</span>@if(totalCount()!==null){@for(page of pageLinks();track $index){@if(page===null){<span aria-hidden="true">&#8230;</span>}@else{<button iamButton type="button" [variant]="page===pageNumber()?'primary':'secondary'" [attr.aria-label]="'Page '+page" [attr.aria-current]="page===pageNumber()?'page':null" [disabled]="disabled()" (click)="pageChanged.emit(page)">{{ page }}</button>}}}<button iamButton type="button" aria-label="Next page" [disabled]="disabled() || !hasNext()" (click)="pageChanged.emit(pageNumber()+1)">›</button></div></div>`, styles: `.pagination,.controls,label { display:flex; align-items:center; flex-wrap:wrap; gap:12px; }.pagination { justify-content:space-between; padding:16px 0 0; }select { width:80px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridPaginationComponent {
    readonly pageNumber = input.required<number>();
    readonly pageSize = input.required<number>();
    readonly count = input(0);
    readonly totalCount = input<number | null>(0);
    readonly next = input(false);
    readonly disabled = input(false);
    readonly sizes = input<readonly number[]>([10, 25, 50, 100]);
    readonly sizeChanged = output<number>();
    readonly pageChanged = output<number>();
    readonly pages = computed(() => Math.max(1, Math.ceil((this.totalCount() ?? 0) / this.pageSize())));
    readonly pageLinks=computed<readonly (number|null)[]>(()=>{const total=this.pages(),current=this.pageNumber();const selected=new Set([1,total]);for(let page=Math.max(1,current-1);page<=Math.min(total,Math.max(5,current+1));page++)selected.add(page);const result:(number|null)[]=[];const sorted=[...selected].sort((a,b)=>a-b);for(const page of sorted){const previous=result.at(-1);if(typeof previous==='number'&&page-previous>1)result.push(null);result.push(page);}return result;});
    readonly hasNext = computed(() => this.totalCount() === null ? this.next() : this.pageNumber() < this.pages());
    readonly summary = computed(() => { const count = this.count(); const start = count ? (this.pageNumber() - 1) * this.pageSize() + 1 : 0; return `Showing ${start}–${count ? start + count - 1 : 0}` + (this.totalCount() === null ? ' · total unknown' : ` of ${this.totalCount()}`); });
}
@Component({ selector: 'smart-grid-column-preferences', imports: [Button], template: `<section aria-label="Column preferences"><p>Choose visible columns. Use the grid header to drag or resize columns, or use these keyboard-friendly controls.</p>@for(column of columns();track column.id;let index=$index){<div class="column"><label><input type="checkbox" [checked]="!column.hidden" [disabled]="!column.hidden && visibleCount() <= 1" (change)="visibility.emit({id:column.id,visible:$any($event.target).checked})" />{{ header(column.id) }}</label><label>Width for {{ header(column.id) }}<input class="smart-input" type="number" min="80" max="1200" [value]="column.width" (change)="resize.emit({id:column.id,width:+$any($event.target).value})" /></label><button iamButton type="button" [attr.aria-label]="'Move ' + header(column.id) + ' left'" [disabled]="index===0" (click)="moved.emit({id:column.id,direction:-1})">←</button><button iamButton type="button" [attr.aria-label]="'Move ' + header(column.id) + ' right'" [disabled]="index===columns().length-1" (click)="moved.emit({id:column.id,direction:1})">→</button></div>}</section>`, styles: `.column { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:12px 0; }label { display:flex; align-items:center; gap:8px; }input[type=number] { width:90px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridColumnPreferencesComponent {
    readonly visibleCount=computed(()=>this.columns().filter(column=>!column.hidden).length);
    readonly columns = input.required<readonly GridColumnPreference[]>();
    readonly headers = input.required<Readonly<Record<string, string>>>();
    readonly visibility = output<{
        id: string;
        visible: boolean;
    }>();
    readonly resize = output<{
        id: string;
        width: number;
    }>();
    readonly moved = output<{
        id: string;
        direction: -1 | 1;
    }>();
    header(id: string): string { return this.headers()[id] ?? id; }
}
@Component({ selector: 'smart-grid-empty-state', imports: [FeedbackState], template: `<iam-feedback-state kind="empty" title="No matching records" description="Change the search or clear the filters." />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridEmptyStateComponent {
}
@Component({ selector: 'smart-grid-loading-state', imports: [SmartSpinner], template: `<p role="status"><smart-spinner /> Loading records…</p>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridLoadingStateComponent {
}
@Component({ selector: 'smart-grid-error-state', imports: [FeedbackState], template: `<iam-feedback-state kind="error" title="Records could not be loaded" [description]="message()" actionLabel="Retry records" (retry)="retried.emit()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridErrorStateComponent {
    readonly message = input('Try again later.');
    readonly retried = output<void>();
}
