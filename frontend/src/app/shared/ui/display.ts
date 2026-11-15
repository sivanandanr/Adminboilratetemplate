import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, IconName } from '../icon';
export type SmartTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';
@Component({ selector: 'smart-card', template: `<section class="panel smart-card" [attr.aria-label]="title() || null">@if (title()) { <h2>{{ title() }}</h2> }<ng-content /></section>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartCard { readonly title = input(''); }
export type StatusTone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export const statusToneForRisk = (risk: RiskLevel): StatusTone => ({none:'mute',low:'ok',medium:'warn',high:'bad',critical:'bad'} as const)[risk];
export const statusToneForLegacy = (tone: SmartTone): StatusTone => ({neutral:'mute',success:'ok',warning:'warn',danger:'bad',info:'info'} as const)[tone];
@Component({selector:'smart-status-badge',template:`<span class="badge" [attr.data-tone]="resolvedTone()">@if(label()){ {{label()}} }@else{<ng-content />}</span>`,styles:`[data-tone='ok']{background:var(--iam-success-fill);color:var(--iam-success-text);}[data-tone='bad']{background:var(--iam-danger-fill);color:var(--iam-text-secondary);}[data-tone='warn']{background:var(--iam-warning-fill);color:var(--iam-text-secondary);}[data-tone='info']{background:var(--iam-info-fill);color:var(--iam-text-secondary);}[data-tone='mute']{background:var(--iam-neutral-fill);color:var(--iam-text-secondary);}:host-context([data-theme='dark']) .badge:not([data-tone='ok']){color:var(--iam-sidebar);}`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartStatusBadge {
 readonly tone=input<StatusTone>('mute'); readonly label=input(''); readonly risk=input<RiskLevel|null>(null);
 readonly resolvedTone=computed(()=>this.risk() ? statusToneForRisk(this.risk()!) : this.tone());
}
export { SmartStatusBadge as StatusBadge };
@Component({selector:'smart-badge',imports:[SmartStatusBadge],template:`<smart-status-badge [tone]="mappedTone()"><ng-content /></smart-status-badge>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartBadge { readonly tone=input<SmartTone>('neutral'); readonly mappedTone=computed(()=>statusToneForLegacy(this.tone())); }
@Component({selector:'smart-status-indicator',imports:[SmartStatusBadge,Icon],template:`<smart-status-badge [tone]="mappedTone()"><iam-icon [name]="icon()" [size]="14" />{{ label() }}</smart-status-badge>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartStatusIndicator {readonly label=input.required<string>();readonly tone=input<SmartTone>('neutral');readonly icon=input<IconName>('CircleCheck');readonly mappedTone=computed(()=>statusToneForLegacy(this.tone()));}
@Component({ selector: 'smart-divider', template: `<hr class="smart-divider" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDivider {}
@Component({ selector: 'smart-skeleton', template: `<span class="skeleton" [style.width]="width()" [style.height]="height()" aria-hidden="true"></span><span class="sr-only">{{ label() }}</span>`, styles: `:host { display:block; }.skeleton { display:block; max-width:100%; background:var(--iam-primary-soft); border-radius:var(--iam-radius-md); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartSkeleton { readonly width = input('100%'); readonly height = input('24px'); readonly label = input('Loading content'); }
@Component({ selector: 'smart-loading-overlay', imports: [Icon], template: `<div class="loading-container" [attr.aria-busy]="loading()"><div [inert]="loading()"><ng-content /></div>@if (loading()) { <div class="loading-cover" role="status"><iam-icon name="LoaderCircle" />{{ label() }}</div> }</div>`, styles: `.loading-container { position:relative; min-height:60px; }.loading-cover { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:8px; background:var(--iam-surface); border:1px solid var(--iam-border); border-radius:var(--iam-radius-md); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartLoadingOverlay { readonly loading = input(false); readonly label = input('Loading content'); }
