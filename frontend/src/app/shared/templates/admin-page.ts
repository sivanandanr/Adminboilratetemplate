import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PageHeader } from '../page-header';
import { FeedbackState } from '../feedback-state';
import { IconName } from '../icon';

export const pageTemplateKinds = ['listing','create','edit','details','master-detail','tabbed-details','configuration','wizard','approval','audit'] as const;
export type PageTemplateKind = typeof pageTemplateKinds[number];
@Component({selector:'smart-admin-page',imports:[PageHeader,FeedbackState],template:`
 <iam-page-header [title]="title()" [description]="description()" [icon]="icon()"><div page-actions class="template-actions"><ng-content select="[template-actions]" /></div><span page-meta class="badge">{{ mock() ? 'Mock data · memory only' : 'Connected API' }}</span></iam-page-header>
 <div [attr.data-template]="kind()" [attr.aria-busy]="state()==='loading'">
 @switch(state()) {
 @case('loading'){<p role="status">Loading {{ title() }}…</p>}
 @case('empty'){<iam-feedback-state kind="empty" title="No records available" description="There are no matching records to display." />}
 @case('error'){<iam-feedback-state kind="error" title="Page unavailable" description="The requested data could not be loaded." actionLabel="Retry page" (retry)="retried.emit()" />}
 @default{<ng-content />}
 }</div>`,styles:`:host { display:block; min-width:0; }.template-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }`,changeDetection:ChangeDetectionStrategy.OnPush})
export class AdminPageTemplate {
 readonly title=input.required<string>();
 readonly description=input('');
 readonly icon=input<IconName>('Layers');
 readonly kind=input.required<PageTemplateKind>();
 readonly state=input<'ready'|'loading'|'empty'|'error'>('ready');
 readonly mock=input(false);
 readonly retried=output<void>();
}
