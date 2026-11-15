import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '../../core/auth/auth.facade';
import { PageHeader } from '../../shared/page-header';
import { SmartCheckbox, SmartDropdown, SmartTextarea, SmartTextbox, SmartToggle, SmartCard, SmartButton } from '../../shared/ui';
import { SmartWizard, UnsavedAware, WizardConfiguration } from '../../shared/ui/wizard';
import { abortableDemoDelay } from './demo-utils';
@Component({ selector: 'iam-wizard-showcase', imports: [PageHeader, ReactiveFormsModule, SmartWizard, SmartTextbox, SmartTextarea, SmartDropdown, SmartCheckbox, SmartToggle, SmartCard, SmartButton], template: `
<iam-page-header title="Application Registration" description="Development-only five-step wizard; drafts and submissions are held in memory." icon="Layers" />
<smart-card title="Demonstration options"><label>Presentation<select class="smart-input" [value]="orientation()" (change)="orientation.set($any($event.target).value)"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label><div class="smart-actions"><smart-button [label]="failSubmit() ? 'Allow submission' : 'Fail next submission'" (pressed)="failSubmit.set(!failSubmit())" /><smart-button [label]="failDraft() ? 'Allow draft save' : 'Fail draft save'" (pressed)="failDraft.set(!failDraft())" /></div><p role="status">{{ draft() ? 'A draft snapshot is saved in memory.' : 'No draft saved.' }}</p></smart-card>
<smart-wizard #wizard [config]="configuration" [orientation]="orientation()" (stepChanged)="step.set($event)" (submitted)="saved.set(true)">
<form [formGroup]="form" (submit)="$event.preventDefault()"><div class="smart-form-grid">
@switch(step()) {
 @case(0){<smart-textbox label="Application name" formControlName="name" [required]="true" hint="At least three characters." /><smart-textarea label="Description" formControlName="description" />}
 @case(1){<smart-dropdown label="Application owner" formControlName="owner" [required]="true" [options]="[{value:'owner-1',label:'Application team'},{value:'unavailable',label:'Unavailable owner (async validation failure)'}]" />}
 @case(2){<smart-dropdown label="Application category" formControlName="category" [options]="[{value:'web',label:'Web application'},{value:'service',label:'Service'}]" /><smart-toggle label="Provisioning enabled" formControlName="provisioning" onLabel="Enabled" offLabel="Disabled" />}
 @case(3){<dl><dt>Application</dt><dd>{{ form.controls.name.value }}</dd><dt>Owner</dt><dd>{{ form.controls.owner.value === 'owner-1' ? 'Application team' : 'Unavailable owner' }}</dd><dt>Category</dt><dd>{{ form.controls.category.value === 'web' ? 'Web application' : 'Service' }}</dd><dt>Provisioning</dt><dd>{{ form.controls.provisioning.value ? 'Enabled' : 'Disabled' }}</dd></dl><smart-checkbox label="Confirm registration details" formControlName="reviewed" [required]="true" />}
 @case(4){<div role="status"><h3>Application registration completed</h3><p>The mock submission was confirmed. No backend record was created.</p></div>}
}</div></form></smart-wizard>`, styles: `smart-card { display:block; margin-bottom:16px; }dt { font-weight:600; }dd { margin:0 0 8px; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class WizardShowcase implements UnsavedAware {
    private readonly auth = inject(AuthFacade);
    @ViewChild('wizard')
    private wizard?: SmartWizard;
    readonly step = signal(0);
    readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
    readonly failSubmit = signal(false);
    readonly failDraft = signal(false);
    readonly saved = signal(false);
    readonly draft = signal<string | null>(null);
    readonly form = new FormGroup({ name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }), description: new FormControl('', { nonNullable: true }), owner: new FormControl('', { nonNullable: true, validators: Validators.required }), category: new FormControl('web', { nonNullable: true }), provisioning: new FormControl(false, { nonNullable: true }), reviewed: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }) });
    readonly configuration: WizardConfiguration = { steps: [{ id: 'basic', title: 'Basic Information', description: 'Identify the application.', validate: () => { this.form.controls.name.markAsTouched(); return this.form.controls.name.valid || 'Enter an application name with at least three characters.'; } }, { id: 'ownership', title: 'Ownership', description: 'Assign an application owner.', validate: async ({ signal }) => { this.form.controls.owner.markAsTouched(); if (this.form.controls.owner.invalid)
                    return 'Select an application owner.'; await abortableDemoDelay(350, signal); return this.form.controls.owner.value !== 'unavailable' || 'This owner is unavailable. Select another owner.'; } }, { id: 'configuration', title: 'Configuration', description: 'Optional configuration preferences.', optional: true }, { id: 'review', title: 'Review', description: 'Review and confirm the details.', validate: () => { this.form.controls.reviewed.markAsTouched(); return this.form.controls.reviewed.valid || 'Confirm the registration details before finishing.'; } }, { id: 'completion', title: 'Completion', description: 'Registration result.' }], dirty: () => this.form.dirty, saveDraft: async () => { const snapshot = JSON.stringify(this.form.getRawValue()); await new Promise(resolve => setTimeout(resolve, 250)); if (this.failDraft())
            throw new Error('Mock draft failure'); this.draft.set(snapshot); if (snapshot === JSON.stringify(this.form.getRawValue()))
            this.form.markAsPristine(); }, submit: async ({ signal }) => { await abortableDemoDelay(500, signal); if (this.failSubmit()) {
            this.failSubmit.set(false);
            throw new Error('Mock submission failure');
        } this.form.markAsPristine(); } };
    requestLeave(): Promise<boolean> { return this.auth.isAuthenticated() ? this.wizard?.requestLeave() ?? Promise.resolve(true) : Promise.resolve(true); }
}
