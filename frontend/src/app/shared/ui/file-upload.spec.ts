import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartFileUpload } from './file-upload';

describe('Inline upload progress and validation', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
    it('shows limits and real transfer progress without performing HTTP from the control', () => {
        const fixture = TestBed.createComponent(SmartFileUpload), file = new File(['rows'], 'members.csv', { type: 'text/csv' }); fixture.componentRef.setInput('accept', '.csv'); fixture.componentInstance.field.writeValue([file]); fixture.componentRef.setInput('uploads', [{ file, status: 'uploading', loaded: 48, total: 100, canCancel: true }]); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(host.textContent).toContain('Allowed types: .csv'); expect(host.textContent).toContain('Maximum 10 MB'); expect(host.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('48'); expect(host.querySelector('input')!.disabled).toBeTrue();
        const cancel = jasmine.createSpy(); fixture.componentInstance.cancelled.subscribe(cancel); host.querySelector<HTMLButtonElement>('button')!.click(); expect(cancel).toHaveBeenCalledWith(file);
    });
    it('treats checking as indeterminate, shows acknowledged readiness and actionable errors', () => {
        const fixture = TestBed.createComponent(SmartFileUpload), file = new File(['x'], 'members.csv'); fixture.componentInstance.field.writeValue([file]); fixture.componentRef.setInput('uploads', [{ file, status: 'checking', loaded: 100, total: 100 }]); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(host.querySelector('[role=progressbar]')!.hasAttribute('aria-valuenow')).toBeFalse(); expect(host.textContent).toContain('Checking');
        fixture.componentRef.setInput('uploads', [{ file, status: 'ready', message: '12 rows checked.' }]); fixture.detectChanges(); expect(host.textContent).toContain('12 rows checked.'); expect(host.querySelector('[role=progressbar]')!.getAttribute('aria-valuenow')).toBe('100');
        fixture.componentRef.setInput('uploads', [{ file, status: 'failed' }]); fixture.detectChanges(); expect(host.querySelector('[role=alert]')?.textContent).toContain('Check the file type, size and connection');
    });
});
