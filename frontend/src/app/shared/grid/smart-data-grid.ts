import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, GridApi, GridReadyEvent, SelectionChangedEvent, SortChangedEvent, themeQuartz } from 'ag-grid-community';
import { ErrorPresenter } from '../../core/feedback/error-presenter';
import { ToastService } from '../../core/feedback/toast.service';
import { ProgressService } from '../../core/feedback/progress.service';
import { SmartButton } from '../ui/actions';
import { SmartTextbox } from '../ui/textbox';
import { SmartDropdown } from '../ui/dropdown';
import { SmartAutocomplete } from '../ui/autocomplete';
import { SmartCheckbox } from '../ui/checkbox';
import { SmartModal } from '../ui/modal';
import { GridAction, GridColumn, GridDataSource, GridFilter, GridOperator, GridRequest, initialGridRequest } from './grid.models';
import { GridController } from './grid-controller';
import { GridColumnPreference, GridPreferencesService } from './grid-preferences.service';
import { GridExportService, exportFilename } from './grid-export.service';
import { GridColumnPreferencesComponent, GridEmptyStateComponent, GridErrorStateComponent, GridLoadingStateComponent, GridPaginationComponent, GridToolbarComponent } from './grid-controls';
import { GridCellComponent, GridRowActionsComponent } from './grid-cell';
@Component({ selector: 'smart-data-grid', imports: [AgGridAngular, ReactiveFormsModule, SmartButton, SmartTextbox, SmartDropdown, SmartAutocomplete, SmartCheckbox, SmartModal, GridToolbarComponent, GridPaginationComponent, GridColumnPreferencesComponent, GridEmptyStateComponent, GridLoadingStateComponent, GridErrorStateComponent], templateUrl: './smart-data-grid.html', styleUrl: './smart-data-grid.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDataGridComponent<T> {
    readonly gridId = input.required<string>();
    readonly title = input.required<string>();
    readonly source = input.required<GridDataSource<T>>();
    readonly columns = input.required<readonly GridColumn<T>[]>();
    readonly rowId = input.required<(row: T) => string>();
    readonly rowLabel = input.required<(row: T) => string>();
    readonly preferencesScope = input('');
    readonly pageSizes = input<readonly number[]>([10, 25, 50, 100]);
    readonly rowActions = input<readonly GridAction<T>[]>([]);
    readonly bulkActions = input<readonly {
        id: string;
        label: string;
    }[]>([]);
    readonly rowAction = output<{
        id: string;
        row: T;
    }>();
    readonly bulkAction = output<{
        id: string;
        rows: readonly T[];
    }>();
    readonly selectionChanged = output<readonly T[]>();
    readonly state = new GridController<T>(inject(ErrorPresenter));
    private readonly preferences = inject(GridPreferencesService);
    private readonly exports = inject(GridExportService);
    private readonly toasts = inject(ToastService);
    private readonly progress = inject(ProgressService);
    readonly modules = [AllCommunityModule];
    readonly theme = themeQuartz.withParams({ fontFamily: 'var(--iam-font-family)', fontSize: 14, headerFontWeight: 600, backgroundColor: 'var(--iam-grid-row)', foregroundColor: 'var(--iam-text)', headerBackgroundColor: 'var(--iam-grid-header)', headerTextColor: 'var(--iam-text)', borderColor: 'var(--iam-border)', oddRowBackgroundColor: 'var(--iam-grid-row)', rowHoverColor: 'var(--iam-hover)', selectedRowBackgroundColor: 'var(--iam-grid-selected)', accentColor: 'var(--iam-accent)', rowHeight: 40, headerHeight: 40, spacing: 4, wrapperBorder: false, borderRadius: 0, checkboxUncheckedBorderColor: 'var(--iam-text)', checkboxUncheckedBackgroundColor: 'var(--iam-control-fill)', checkboxCheckedBackgroundColor: 'var(--iam-primary)', checkboxCheckedBorderColor: 'var(--iam-primary)', checkboxCheckedShapeColor: 'var(--iam-on-primary)' });
    readonly defaultColDef: ColDef<T> = { resizable: true, filter: false, comparator: () => 0, minWidth: 100 };
    readonly selection = { mode: 'multiRow' as const, selectAll: 'all' as const, enableClickSelection: false, headerCheckbox: true };
    readonly search = new FormControl('', { nonNullable: true });
    readonly filterField = new FormControl('', { nonNullable: true });
    readonly filterOperator = new FormControl('contains', { nonNullable: true });
    readonly filterText = new FormControl('', { nonNullable: true });
    readonly filterMany = new FormControl<string | readonly string[] | null>([]);
    readonly selected = signal<readonly T[]>([]);
    private selectedIds = new Set<string>();
    private restoring = false;
    private api?: GridApi<T>;
    readonly configuring = signal(true);
    readonly exporting = signal(false);
    readonly showPreferences = signal(false);
    readonly showExport = signal(false);
    readonly exportError = signal('');
    readonly layout = signal<readonly GridColumnPreference[]>([]);
    readonly filterIssue = signal('');
    readonly activeFilter = signal('');
    readonly exportScope = new FormControl('page', { nonNullable: true });
    readonly exportFormat = new FormControl('csv', { nonNullable: true });
    readonly filename = new FormControl('records', { nonNullable: true });
    exportControls: Record<string, FormControl<boolean>> = {};
    readonly validSizes = computed(() => this.pageSizes().filter(size => Number.isSafeInteger(size) && size > 0 && size <= this.source().capabilities.maxPageSize));
    readonly rows = computed(() => Array.from(this.state.page().items));
    readonly busy = computed(() => this.configuring() || this.state.loading() || this.exporting());
    readonly filterColumns = computed(() => this.columns().filter(column => (this.source().capabilities.filters[column.id]?.length ?? 0) > 0));
    readonly activeColumn = computed(() => this.columns().find(column => column.id === this.activeFilter()));
    readonly operators = computed(() => this.source().capabilities.filters[this.activeFilter()] ?? []);
    readonly columnHeaders = computed(() => Object.fromEntries(this.columns().map(column => [column.id, column.header])));
    readonly exportable = computed(() => this.columns().filter(column => column.export?.allowed));
    readonly exportScopes = computed(() => [{ value: 'page', label: 'Current page' }, { value: 'selected', label: 'Selected rows on this page' }, ...(this.source().mode === 'client' ? [{ value: 'filtered', label: 'All filtered client rows' }] : [])]);
    readonly defs = computed<ColDef<T>[]>(() => [...this.columns().map(column => ({ colId: column.id, headerName: column.header, valueGetter: params => params.data ? column.value(params.data) : null, sortable: this.source().capabilities.sortFields.includes(column.id), width: column.width ?? 170, cellRenderer: GridCellComponent, cellRendererParams: { smartColumn: column } } satisfies ColDef<T>)), ...(this.rowActions().length ? [{ colId: '__actions', headerName: 'Actions', width: 105, minWidth: 100, sortable: false, resizable: false, suppressMovable: true, cellRenderer: GridRowActionsComponent, cellRendererParams: { actions: this.rowActions(), rowLabel: this.rowLabel(), chosen: (id: string, row: T) => this.rowAction.emit({ id, row }) }, suppressKeyboardEvent: params => !!(params.event.target as HTMLElement)?.closest('button,[role=menu]') && ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(params.event.key) } satisfies ColDef<T>] : [])]);
    constructor() {
        this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(searchText => this.change({ ...this.state.request(), pageNumber: 1, searchText: searchText.slice(0, 256) }));
        this.filterField.valueChanges.pipe(takeUntilDestroyed()).subscribe(field => { this.activeFilter.set(field); this.filterOperator.setValue(this.source().capabilities.filters[field]?.[0] ?? 'contains'); this.filterText.setValue(''); this.filterMany.setValue([]); });
        effect(cleanup => {
            const source = this.source(), columns = this.columns(), scope = this.preferencesScope(), id = this.gridId(), sizes = this.validSizes();
            let cancelled = false;
            this.configuring.set(true);
            this.state.source.set(null);
            this.selectedIds.clear();
            this.selected.set([]);
            this.search.setValue('', { emitEvent: false });
            this.filterField.setValue('', { emitEvent: false });
            this.activeFilter.set('');
            this.filterText.setValue('');
            this.filterMany.setValue([]);
            this.filename.setValue(id);
            this.exportControls = Object.fromEntries(columns.filter(column => column.export?.allowed).map(column => [column.id, new FormControl(true, { nonNullable: true })]));
            void (scope ? this.preferences.load(scope, id, columns.map(column => column.id), sizes) : Promise.resolve(null)).then(saved => { if (cancelled)
                return; const layout = saved?.columns ?? columns.map(column => ({ id: column.id, width: column.width ?? 170, hidden: false })); this.layout.set(layout); this.state.request.set({ ...initialGridRequest, pageSize: saved?.pageSize ?? sizes[0] ?? 10 }); this.state.source.set(source); this.api?.applyColumnState({ state: layout.map(column => ({ colId: column.id, width: column.width, hide: column.hidden, sort: null })), applyOrder: true }); this.configuring.set(false); });
            cleanup(() => cancelled = true);
        });
    }
    getRowId = (params: {
        data: T;
    }): string => this.rowId()(params.data);
    ready(event: GridReadyEvent<T>): void { this.api = event.api; this.api.applyColumnState({ state: this.layout().map(column => ({ colId: column.id, width: column.width, hide: column.hidden, sort: null })), applyOrder: true }); this.syncLayout(); }
    change(request: GridRequest): void { if (this.state.change(request)) {
        this.selectedIds.clear();
        this.selected.set([]);
        this.api?.deselectAll();
        this.selectionChanged.emit([]);
    } }
    refresh(): void { this.state.refresh(); }
    sort(event: SortChangedEvent<T>): void { if (this.configuring())
        return; const sorts = event.api.getColumnState().filter(column => column.sort && this.source().capabilities.sortFields.includes(column.colId)).sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0)).map(column => ({ field: column.colId, direction: column.sort as 'asc' | 'desc' })); this.change({ ...this.state.request(), pageNumber: 1, sorts }); }
    selectionUpdated(event: SelectionChangedEvent<T>): void { if (this.restoring || this.state.loading())
        return; this.selected.set(event.api.getSelectedRows()); this.selectedIds = new Set(this.selected().map(this.rowId())); this.selectionChanged.emit(this.selected()); }
    restoreSelection(): void { if (!this.api)
        return; this.restoring = true; this.api.forEachNode(node => node.setSelected(!!node.data && this.selectedIds.has(this.rowId()(node.data)))); this.restoring = false; this.selected.set(this.api.getSelectedRows()); this.selectedIds = new Set(this.selected().map(this.rowId())); }
    syncLayout(): void { if (!this.api)
        return; const columns = this.api.getColumnState().filter(column => this.columns().some(def => def.id === column.colId)).map(column => ({ id: column.colId, width: column.width ?? 170, hidden: !!column.hide })); this.layout.set(columns); if (!this.configuring() && this.preferencesScope())
        void this.preferences.save(this.preferencesScope(), this.gridId(), { version: 1, columns, pageSize: this.state.request().pageSize }); }
    visibility(value: {
        id: string;
        visible: boolean;
    }): void { if (!value.visible && this.layout().filter(column => !column.hidden).length <= 1)
        return; this.api?.setColumnsVisible([value.id], value.visible); this.syncLayout(); }
    resize(value: {
        id: string;
        width: number;
    }): void { if (!Number.isFinite(value.width))
        return; this.api?.setColumnWidths([{ key: value.id, newWidth: Math.max(100, Math.min(1200, value.width)) }], true); this.syncLayout(); }
    move(value: {
        id: string;
        direction: -1 | 1;
    }): void { const columns = [...this.layout()]; const index = columns.findIndex(column => column.id === value.id); const target = index + value.direction; if (index < 0 || target < 0 || target >= columns.length)
        return; [columns[index], columns[target]] = [columns[target], columns[index]]; this.api?.applyColumnState({ state: columns.map(column => ({ colId: column.id })), applyOrder: true }); this.syncLayout(); }
    size(pageSize: number): void { if (!this.validSizes().includes(pageSize))
        return; this.change({ ...this.state.request(), pageNumber: 1, pageSize }); this.syncLayout(); }
    page(pageNumber: number): void { this.change({ ...this.state.request(), pageNumber }); }
    addFilter(): void {
        this.filterIssue.set('');
        const column = this.activeColumn(), operator = this.filterOperator.value as GridOperator;
        if (!column || !this.operators().includes(operator))
            return;
        let value: GridFilter['value'] = this.filterText.value.trim();
        if (operator === 'in') {
            const selected = this.filterMany.value;
            value = Array.isArray(selected) ? selected : typeof selected === 'string' ? [selected] : [];
            if (!value.length)
                return;
        }
        else {
            if (!value)
                return;
            if (column.kind === 'number') {
                value = Number(value);
                if (!Number.isFinite(value)) {
                    this.filterIssue.set('Enter a valid number.');
                    return;
                }
            }
            if (column.kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
                this.filterIssue.set('Enter an ISO date.');
                return;
            }
        }
        const filters = [...this.state.request().filters.filter(filter => filter.field !== column.id || filter.operator !== operator), { field: column.id, operator, value }];
        this.change({ ...this.state.request(), pageNumber: 1, filters });
    }
    removeFilter(index: number): void { this.change({ ...this.state.request(), pageNumber: 1, filters: this.state.request().filters.filter((_, position) => position !== index) }); }
    clear(): void { this.search.setValue('', { emitEvent: false }); this.filterText.setValue(''); this.filterMany.setValue([]); this.change({ ...this.state.request(), pageNumber: 1, filters: [], searchText: '' }); }
    filterOptions(): readonly {
        value: string;
        label: string;
    }[] { return this.filterColumns().map(column => ({ value: column.id, label: column.header })); }
    operatorLabel(value: GridOperator, kind = this.activeColumn()?.kind): string { const labels: Record<GridOperator, string> = { contains: 'Contains', equals: 'Equals', in: 'Any of', gte: kind === 'date' ? 'On or after' : 'At least', lte: kind === 'date' ? 'On or before' : 'At most' }; return labels[value]; }
    operatorOptions(): readonly {
        value: string;
        label: string;
    }[] { return this.operators().map(value => ({ value, label: this.operatorLabel(value) })); }
    chip(filter: GridFilter): string { return (this.columnHeaders()[filter.field] ?? filter.field) + ' ' + this.operatorLabel(filter.operator, this.columns().find(column => column.id === filter.field)?.kind).toLowerCase() + ' ' + (Array.isArray(filter.value) ? filter.value.join(', ') : filter.value); }
    async export(): Promise<void> { if (this.busy())
        return; this.exportError.set(''); this.exporting.set(true); const operation = this.progress.begin('Prepare export'); try {
        const scope = this.exportScope.value;
        const rows = scope === 'selected' ? this.selected() : scope === 'filtered' ? this.source().filteredRows?.(this.state.request()) : this.state.page().items;
        if (!rows?.length)
            throw new Error('No permitted export rows');
        const columnIds = this.exportable().filter(column => this.exportControls[column.id]?.value).map(column => column.id);
        const sheet = { name: this.title(), rows, columns: this.columns(), columnIds };
        const format = this.exportFormat.value === 'xlsx' ? 'xlsx' : 'csv';
        const blob = format === 'csv' ? this.exports.csv(sheet) : await this.exports.xlsx([sheet]);
        this.exports.download(blob, exportFilename(this.filename.value, format));
        this.progress.finish(operation, 'success');
        this.progress.dismiss(operation);
        this.toasts.show({ tone: 'success', title: 'Export prepared', message: 'The permitted fields are ready to download.' });
        this.showExport.set(false);
    }
    catch {
        this.progress.finish(operation, 'error');
        this.progress.dismiss(operation);
        this.exportError.set('Unable to prepare this export. Choose permitted columns and rows, or use a backend job for larger exports.');
    }
    finally {
        this.exporting.set(false);
    } }
}
