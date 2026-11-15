import { ChangeDetectionStrategy, Component, ViewChild, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { SmartDataGridComponent } from '../../../shared/grid/smart-data-grid';
import { ClientGridDataSource, ServerGridDataSource } from '../../../shared/grid/grid-data-source';
import { GridDataSource, initialGridRequest } from '../../../shared/grid/grid.models';
import { GridExportJobComponent } from '../../../shared/grid/export-jobs';
import { GridExportService, exportFilename } from '../../../shared/grid/grid-export.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ConfirmationService } from '../../../core/feedback/dialog.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { PageHeader } from '../../../shared/page-header';
import { SmartButton, SmartDrawer } from '../../../shared/ui';
import { DemoDataset, DemoGridRecord, createGridFixtures, decodeDemoRecord, demoDatasets, demoGridCapabilities, demoGridColumns } from './grid-fixtures';
import { MockGridApi } from './mock-grid-api';
import { MockExportJobProvider } from './mock-export-job.provider';
import { abortableDemoDelay } from '../demo-utils';
@Component({ selector: 'iam-grid-showcase', imports: [PageHeader, SmartDataGridComponent, SmartButton, SmartDrawer, GridExportJobComponent], providers: [MockExportJobProvider], template: `
<iam-page-header [title]="'Enterprise Grid · ' + mode" description="Protected development examples with 10,000 deterministic records per dataset." icon="Users" />
<section class="panel demo-options"><label>Dataset<select class="smart-input" [value]="dataset()" (change)="selectDataset($event)">@for(dataset of datasets;track dataset){<option [value]="dataset">{{ dataset }}</option>}</select></label>@if(mode==='server'){<label>Server scenario<select class="smart-input" [value]="backend.scenario()" (change)="scenario($event)">@for(scenario of ['normal','error','empty','loading','unknown'];track scenario){<option [value]="scenario">{{ scenario }}</option>}</select></label><p role="status">{{ backend.requests() }} HTTP requests · {{ backend.cancellations() }} cancelled or failed</p>}@if(mode==='export'){<p>Browser exports are bounded. Job downloads below are ten-row samples, not million-row exports.</p><smart-button label="Download multi-sheet example" (pressed)="multiSheet()" /><label>Job scenario<select class="smart-input" [value]="jobs.scenario()" (change)="jobScenario($event)">@for(scenario of ['normal','failed','expired','unknown'];track scenario){<option [value]="scenario">{{ scenario }}</option>}</select></label>}</section>
<smart-data-grid #grid [gridId]="'demo-' + mode + '-' + dataset()" [title]="dataset()" [source]="source()" [columns]="columns" [rowId]="rowId" [rowLabel]="rowLabel" [preferencesScope]="auth.user()?.id ?? ''" [rowActions]="actions" [bulkActions]="[{id:'deactivate',label:'Deactivate selected'}]" (rowAction)="rowAction($event)" (bulkAction)="deactivate($event.rows)" />
@if(mode==='export'){<smart-grid-export-job [provider]="jobs" [request]="jobRequest()" [pollingMs]="500" />}
<smart-drawer title="Record details" [open]="!!detail()" (closed)="detail.set(null)"><dl><dt>Name</dt><dd>{{ detail()?.name }}</dd><dt>Category</dt><dd>{{ detail()?.category }}</dd><dt>Status</dt><dd>{{ detail()?.status }}</dd></dl></smart-drawer>`, styles: `.demo-options { padding:16px; display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:16px; }label { display:grid; gap:4px; }p { margin:0; }dt { font-weight:600; }dd { margin:0 0 12px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridShowcase {
    readonly mode = (inject(ActivatedRoute).snapshot.data['gridMode'] ?? 'client') as 'client' | 'server' | 'export' | 'selection';
    readonly auth = inject(AuthFacade);
    readonly backend = inject(MockGridApi);
    readonly jobs = inject(MockExportJobProvider);
    private readonly http = inject(HttpClient);
    private readonly confirmations = inject(ConfirmationService);
    private readonly toasts = inject(ToastService);
    private readonly exports = inject(GridExportService);
    readonly datasets = demoDatasets;
    readonly dataset = signal<DemoDataset>('employees');
    readonly columns = demoGridColumns;
    private records = createGridFixtures('employees');
    readonly source = signal<GridDataSource<DemoGridRecord>>(this.makeSource());
    readonly detail = signal<DemoGridRecord | null>(null);
    readonly rowId = (row: DemoGridRecord) => row.id;
    readonly rowLabel = (row: DemoGridRecord) => row.name;
    readonly actions = [{ id: 'view', label: 'View details' }, { id: 'deactivate', label: 'Deactivate', allowed: (row: DemoGridRecord) => row.status !== 'Inactive' }];
    jobRequest() { return { resource: this.dataset(), format: 'csv' as const, columnIds: ['id', 'name', 'quantity', 'created', 'status'], query: this.grid?.state.request() ?? initialGridRequest }; }
    @ViewChild('grid')
    private grid?: SmartDataGridComponent<DemoGridRecord>;
    constructor() { effect(() => { if (!this.auth.isAuthenticated()) {
        this.backend.scenario.set('normal');
        this.detail.set(null);
    } }); }
    private makeSource(): GridDataSource<DemoGridRecord> { return this.mode === 'server' ? new ServerGridDataSource(this.http, '/api/dev/grid/' + this.dataset() + '/search', demoGridCapabilities, decodeDemoRecord) : new ClientGridDataSource(this.records, demoGridColumns, demoGridCapabilities); }
    selectDataset(event: Event): void { this.dataset.set((event.target as HTMLSelectElement).value as DemoDataset); this.records = createGridFixtures(this.dataset()); this.source.set(this.makeSource()); }
    scenario(event: Event): void { this.backend.scenario.set((event.target as HTMLSelectElement).value as ReturnType<typeof this.backend.scenario>); this.grid?.refresh(); }
    jobScenario(event: Event): void { this.jobs.scenario.set((event.target as HTMLSelectElement).value as ReturnType<typeof this.jobs.scenario>); }
    rowAction(value: {
        id: string;
        row: DemoGridRecord;
    }): void { if (value.id === 'view')
        this.detail.set(value.row);
    else if (value.id === 'deactivate')
        void this.deactivate([value.row]); }
    async deactivate(rows: readonly DemoGridRecord[]): Promise<void> { await this.confirmations.confirm({ title: 'Deactivate selected records?', message: `This updates ${rows.length} development fixture records only.`, kind: 'privileged', execute: async ({ signal }) => { await abortableDemoDelay(180, signal); const ids = rows.map(row => row.id); if (this.mode === 'server')
            this.backend.deactivate(this.dataset(), ids);
        else
            for (let index = 0; index < this.records.length; index++)
                if (ids.includes(this.records[index].id))
                    this.records[index] = { ...this.records[index], status: 'Inactive' }; this.grid?.refresh(); this.toasts.show({ tone: 'success', title: 'Mock records updated' }); } }); }
    async multiSheet(): Promise<void> { try {
        const columnIds = ['id', 'name', 'quantity', 'created', 'status'];
        const blob = await this.exports.xlsx([{ name: 'Employees', rows: createGridFixtures('employees', 5), columns: this.columns, columnIds }, { name: 'Applications', rows: createGridFixtures('applications', 5), columns: this.columns, columnIds }]);
        this.exports.download(blob, exportFilename('multi-sheet-example', 'xlsx'));
    }
    catch {
        this.toasts.show({ tone: 'error', title: 'Export could not be prepared' });
    } }
}
