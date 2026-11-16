import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BlockUiService, SmartBlockUi } from './block-ui';
import { SmartModal } from './modal';

@Component({ imports: [SmartModal, SmartBlockUi], template: `<button id="launch">Edit</button>@if (renderForm) { <smart-modal title="Edit record" [open]="open"><button id="save">Save</button></smart-modal> }<smart-block-ui />` })
class SavingModalExample { open = false; renderForm = true; }

describe('Shared server-call progress dialog', () => {
    beforeEach(() => { jasmine.clock().install(); jasmine.clock().mockDate(new Date()); TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }); });
    afterEach(() => { TestBed.resetTestingModule(); jasmine.clock().uninstall(); });
    it('is blocking, composed from the shared modal/bar and cannot close through Escape', () => {
        const fixture = TestBed.createComponent(SmartBlockUi), service = TestBed.inject(BlockUiService); const handle = service.begin({ title: 'Saving your changes', steps: ['Check', 'Save', 'Confirm'] }); handle.update({ completedSteps: 1 }); jasmine.clock().tick(300); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement, dialog = host.querySelector('dialog')!;
        expect(dialog.getAttribute('role')).toBe('alertdialog'); expect(dialog.getAttribute('aria-busy')).toBe('true'); expect(host.querySelector('smart-progress-bar')).not.toBeNull(); expect(host.querySelector('.modal-close')).toBeNull(); expect(host.textContent).toContain('Please keep this window open.');
        expect(host.querySelectorAll('[role=alertdialog]').length).toBe(1);
        dialog.dispatchEvent(new Event('cancel', { cancelable: true })); fixture.detectChanges(); expect(dialog.open).toBeTrue(); handle.end();
    });
    it('preempts and resumes an ordinary modal, rather than blocking behind a saving form', () => {
        const form = TestBed.createComponent(SmartModal); form.componentRef.setInput('title', 'Edit'); form.componentRef.setInput('open', true); form.detectChanges();
        const progress = TestBed.createComponent(SmartBlockUi); document.body.appendChild(form.nativeElement as HTMLElement); const service = TestBed.inject(BlockUiService); const handle = service.begin(); jasmine.clock().tick(300); form.detectChanges(); progress.detectChanges(); form.detectChanges();
        expect((progress.nativeElement as HTMLElement).querySelector('dialog')!.open).toBeTrue(); expect((form.nativeElement as HTMLElement).querySelector('dialog')!.open).toBeFalse();
        handle.end(); jasmine.clock().tick(400); progress.detectChanges(); form.detectChanges(); expect((form.nativeElement as HTMLElement).querySelector('dialog')!.open).toBeTrue();
    });
    it('restores the original trigger if a saved form is destroyed while progress is visible', () => {
        const fixture = TestBed.createComponent(SavingModalExample); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
        const launch = host.querySelector<HTMLButtonElement>('#launch')!; launch.focus(); fixture.componentInstance.open = true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); host.querySelector<HTMLButtonElement>('#save')!.focus();
        const handle = TestBed.inject(BlockUiService).begin(); jasmine.clock().tick(300); fixture.detectChanges(); fixture.componentInstance.renderForm = false; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); handle.end(); jasmine.clock().tick(400); fixture.detectChanges();
        expect(document.activeElement).toBe(launch);
    });
});
