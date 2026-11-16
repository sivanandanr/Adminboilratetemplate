import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthFacade } from '../../core/auth/auth.facade';
import { SmartDataGridComponent } from '../../shared/grid/smart-data-grid';
import { ClientGridDataSource } from '../../shared/grid/grid-data-source';
import { SmartDrawer } from '../../shared/ui';
import { createGridFixtures, demoGridCapabilities, demoGridColumns, DemoGridRecord } from './grid/grid-fixtures';

/** Demo data only; grid behavior is owned by the existing shared grid. */
@Component({
 selector:'iam-advanced-grid-pattern', imports:[SmartDataGridComponent,SmartDrawer],
 template:`<p>Explore 1,000 synthetic employees: search, filters, sorting, row selection, column preferences, paging and CSV/XLSX export. Open a row action to inspect its details.</p>
 <smart-data-grid gridId="ui-patterns-advanced" title="Advanced employee grid" [source]="source" [columns]="columns" [rowId]="rowId" [rowLabel]="rowLabel" [preferencesScope]="auth.user()?.id ?? ''" [rowActions]="actions" (rowAction)="detail.set($event.row)" />
 <smart-drawer title="Example employee details" [open]="!!detail()" (closed)="detail.set(null)"><dl><dt>Name</dt><dd>{{detail()?.name}}</dd><dt>Category</dt><dd>{{detail()?.category}}</dd><dt>Owner</dt><dd>{{detail()?.owner}}</dd><dt>Status</dt><dd>{{detail()?.status}}</dd></dl></smart-drawer>`,
 styles:`:host{display:block;min-width:0;}p{margin:var(--iam-space-4) 0;}dt{font-weight:600;}dd{margin:var(--iam-space-1) 0 var(--iam-space-4);}`,
 changeDetection:ChangeDetectionStrategy.OnPush,
})
export class AdvancedGridPattern {
 readonly auth=inject(AuthFacade);
 readonly columns=demoGridColumns;
 readonly source=new ClientGridDataSource(createGridFixtures('employees',1000),demoGridColumns,demoGridCapabilities);
 readonly rowId=(row:DemoGridRecord)=>row.id;
 readonly rowLabel=(row:DemoGridRecord)=>row.name;
 readonly actions=[{id:'view',label:'View details'}];
 readonly detail=signal<DemoGridRecord|null>(null);
}
