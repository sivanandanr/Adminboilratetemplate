import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from '../../core/feedback/dialog.service';
import { Button } from '../button';
import { SmartProgressBar } from './progress';
export interface WizardValidationContext {
    readonly signal: AbortSignal;
}
export interface WizardStep {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly optional?: boolean;
    readonly validate?: (context: WizardValidationContext) => boolean | string | Promise<boolean | string>;
}
export interface WizardConfiguration {
    readonly steps: readonly WizardStep[];
    readonly submit: (context: WizardValidationContext) => Promise<void>;
    readonly saveDraft?: () => Promise<void>;
    readonly dirty?: () => boolean;
}
export interface UnsavedAware {
    requestLeave(): Promise<boolean>;
}
export const UnsavedChangesGuard: CanDeactivateFn<UnsavedAware> = component => component.requestLeave();
@Component({ selector: 'smart-stepper', template: `<nav [attr.aria-label]="label()"><ol [class.vertical]="orientation() === 'vertical'">@for(step of steps();track step.id;let index=$index){<li><button type="button" [disabled]="disabled() || index > current()" [attr.aria-current]="index === current() ? 'step' : null" [class.completed]="completed().includes(step.id)" [class.error]="errorStep() === index" (click)="selected.emit(index)"><span class="step-number" aria-hidden="true">{{ completed().includes(step.id) ? '✓' : index + 1 }}</span><span>{{ step.title }}<small>{{ errorStep() === index ? 'Needs attention' : completed().includes(step.id) ? 'Completed' : step.optional ? 'Optional' : index === current() ? 'Current' : 'Pending' }}</small></span></button></li>}</ol></nav>`, styles: `ol { display:flex; gap:8px; padding:0; margin:0 0 16px; list-style:none; overflow-x:auto; }li { flex:1; min-width:140px; }button { width:100%; display:flex; align-items:center; gap:8px; text-align:left; padding:12px; color:var(--iam-text); background:var(--iam-surface); border:1px solid var(--iam-border); border-radius:var(--iam-radius-md); min-height:56px; }button[aria-current] { border-color:var(--iam-accent); color:var(--iam-accent); }.step-number { border:1px solid var(--iam-control-border); border-radius:50%; width:26px; height:26px; flex-shrink:0; display:grid; place-items:center; }small { display:block; color:var(--iam-text-secondary); }.completed .step-number { background:var(--iam-success-fill); color:var(--iam-success-text); }.error { border-color:var(--iam-icon-danger); }.vertical { flex-direction:column; }.vertical li { flex:auto; }@media(max-width:767px){ol { flex-direction:column; }li { min-width:0; }}`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartStepper {
    readonly steps = input.required<readonly WizardStep[]>();
    readonly current = input(0);
    readonly completed = input<readonly string[]>([]);
    readonly errorStep = input<number | null>(null);
    readonly disabled = input(false);
    readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
    readonly label = input('Operation steps');
    readonly selected = output<number>();
}
let nextWizard = 0;
@Component({ selector: 'smart-wizard', imports: [SmartStepper, SmartProgressBar, Button], template: `<section class="panel wizard" [attr.aria-labelledby]="id"><smart-stepper [steps]="config().steps" [current]="current()" [completed]="completed()" [errorStep]="errorStep()" [disabled]="!!busy() || complete()" [orientation]="orientation()" (selected)="goBack($event)" /><h2 [id]="id" tabindex="-1">{{ step()?.title }}</h2><p>{{ step()?.description }}</p><div [inert]="busy()"><ng-content /></div>@if(error()) { <p class="wizard-error" role="alert">{{ error() }}</p> }@if(message()) { <p role="status">{{ message() }}</p> }@if(busy()) { <smart-progress-bar [label]="busy() === 'submitting' ? 'Submitting application' : busy() === 'draft' ? 'Saving draft' : 'Validating step'" /> }<div class="smart-actions" data-placement="wizard"><div>@if(!complete()){<button iamButton type="button" [disabled]="!!busy() || current() === 0" (click)="previous()">Previous</button>}</div><div class="wizard-buttons">@if(!complete()) { @if(config().saveDraft) {<button iamButton type="button" [disabled]="!!busy()" (click)="saveDraft()">Save draft</button>}@if(step()?.optional) {<button iamButton type="button" [disabled]="!!busy()" (click)="next(true)">Skip optional step</button>}<button iamButton type="button" variant="primary" [loading]="!!busy()" (click)="next()">{{ current() === config().steps.length - 2 ? 'Finish' : 'Next' }}</button> }</div></div></section>`, styles: `.wizard { padding:16px; }h2 { margin:12px 0 4px; }h2:focus { outline:2px solid var(--iam-focus); outline-offset:4px; }.wizard-buttons { display:flex; flex-wrap:wrap; gap:8px; }.wizard-error { padding:12px; color:var(--iam-sidebar); background:var(--iam-danger-fill); border-left:3px solid var(--iam-icon-danger); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartWizard implements UnsavedAware, OnDestroy {
    readonly id = `smart-wizard-${++nextWizard}`;
    readonly config = input.required<WizardConfiguration>();
    readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
    readonly stepChanged = output<number>();
    readonly submitted = output<void>();
    readonly draftSaved = output<void>();
    readonly current = signal(0);
    readonly completed = signal<readonly string[]>([]);
    readonly skipped = signal<readonly string[]>([]);
    readonly errorStep = signal<number | null>(null);
    readonly busy = signal<'validation' | 'draft' | 'submitting' | null>(null);
    readonly error = signal('');
    readonly message = signal('');
    readonly complete = signal(false);
    readonly step = computed<WizardStep | undefined>(() => this.config().steps[this.current()]);
    private readonly confirmations = inject(ConfirmationService);
    private controller?: AbortController;
    private destroyed = false;
    private revision = 0;
    constructor() { effect(() => { const steps = this.config().steps; if (steps.length < 2 || new Set(steps.map(step => step.id)).size !== steps.length)
        throw new Error('Wizard requires at least two steps with unique IDs'); }); }
    private move(index: number): void { this.current.set(index); this.stepChanged.emit(index); queueMicrotask(() => document.getElementById(this.id)?.focus()); }
    previous(): void { this.goBack(this.current() - 1); }
    goBack(index: number): void { if (this.busy() || this.complete() || index < 0 || index >= this.current())
        return; this.error.set(''); this.message.set(''); this.move(index); }
    private async validate(index: number): Promise<boolean> { const step = this.config().steps[index]; const result = await (step.validate?.({ signal: this.controller!.signal }) ?? true); if (this.destroyed || this.controller?.signal.aborted)
        return false; if (result !== true) {
        this.error.set(typeof result === 'string' ? result : 'Complete the required fields before continuing.');
        this.errorStep.set(index);
        this.completed.update(items => items.filter(id => this.config().steps.findIndex(item => item.id === id) < index));
        this.move(index);
        return false;
    } return true; }
    async next(skip = false): Promise<void> {
        if (this.busy() || this.complete() || !this.step() || (skip && !this.step()?.optional))
            return;
        this.busy.set('validation');
        this.error.set('');
        this.message.set('');
        this.controller = new AbortController();
        const revision = ++this.revision;
        try {
            const index = this.current();
            if (!skip && !(await this.validate(index)))
                return;
            if (this.destroyed || revision !== this.revision)
                return;
            if (skip)
                this.skipped.update(items => [...new Set([...items, this.step()!.id])]);
            else {
                this.skipped.update(items => items.filter(id => id !== this.step()!.id));
                this.completed.update(items => [...new Set([...items, this.step()!.id])]);
            }
            if (index === this.config().steps.length - 2) {
                for (let i = 0; i < index; i++) {
                    if (this.config().steps[i].optional && this.skipped().includes(this.config().steps[i].id))
                        continue;
                    if (!(await this.validate(i)))
                        return;
                    if (this.destroyed || revision !== this.revision)
                        return;
                }
                this.busy.set('submitting');
                await this.config().submit({ signal: this.controller.signal });
                if (this.destroyed || revision !== this.revision)
                    return;
                this.complete.set(true);
                this.completed.set(this.config().steps.map(step => step.id));
                this.move(index + 1);
                this.submitted.emit();
            }
            else
                this.move(index + 1);
            this.errorStep.set(null);
        }
        catch {
            if (!this.destroyed && revision === this.revision) {
                this.errorStep.set(this.current());
                this.error.set('The operation failed. Check the result before retrying.');
            }
        }
        finally {
            if (!this.destroyed && revision === this.revision)
                this.busy.set(null);
        }
    }
    async saveDraft(): Promise<void> { if (this.busy() || !this.config().saveDraft || this.complete())
        return; this.busy.set('draft'); this.error.set(''); this.message.set(''); try {
        await this.config().saveDraft!();
        if (!this.destroyed) {
            this.message.set('Draft saved.');
            this.draftSaved.emit();
        }
    }
    catch {
        if (!this.destroyed)
            this.error.set('Draft could not be saved. Try again.');
    }
    finally {
        if (!this.destroyed)
            this.busy.set(null);
    } }
    async requestLeave(): Promise<boolean> { if (this.busy())
        return false; if (this.complete() || !this.config().dirty?.())
        return true; return (await this.confirmations.confirm({ kind: 'unsaved', title: 'Discard unsaved changes?', message: 'Your unsaved wizard changes will be lost.', primaryLabel: 'Discard changes' })).confirmed; }
    @HostListener('window:beforeunload', ['$event'])
    beforeUnload(event: BeforeUnloadEvent): void { if (!this.complete() && (this.busy() || this.config().dirty?.())) {
        event.preventDefault();
        event.returnValue = '';
    } }
    ngOnDestroy(): void { this.destroyed = true; ++this.revision; this.controller?.abort(); }
}
