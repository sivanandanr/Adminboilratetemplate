import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../../core/feedback/dialog.service';
import { SmartConfirmDialog, SmartDialogHost } from './dialogs';

describe('Part 1 dialog APIs', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('enforces a required trimmed reason, reports it under the field and clears the error on correction', async () => {
    const fixture = TestBed.createComponent(SmartConfirmDialog); fixture.componentRef.setInput('options', { title: 'Remove', text: 'Remove this record?', kind: 'remove', reason: 'required' }); fixture.detectChanges();
    fixture.componentInstance.reason.setValue('   '); await fixture.componentInstance.confirm(); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.reason-field .smart-errors')?.textContent).toContain('Enter a reason');
    expect(host.querySelectorAll('.reason-field .smart-errors p').length).toBe(1);
    const field = host.querySelector('textarea')!;
    expect(field.getAttribute('aria-describedby')).toBe(field.id + '-error');
    expect(host.querySelector('button.button-danger.button-solid')).not.toBeNull();
    expect(host.querySelector('button.button-danger')?.textContent).toContain('Confirm');
    expect(host.querySelector('.modal-close')).toBeNull();
    fixture.componentInstance.reason.setValue('Duplicate record'); fixture.detectChanges(); expect(host.querySelector('.reason-field .smart-errors')).toBeNull();
  });
  it('keeps legacy confirmed results and supports aliases through one queued host', async () => {
    const fixture = TestBed.createComponent(SmartDialogHost); const service = TestBed.inject(DialogService);
    const result = service.confirmWithReason({ title: 'Withdraw', text: 'Continue?', okLabel: 'Withdraw', okVariant: 'warning' });
    const info = service.info({ title: 'Information', text: 'Safe text' }); fixture.detectChanges();
    expect(service.requests()[0].options.reason).toBe('required'); expect((fixture.nativeElement as HTMLElement).querySelectorAll('dialog[open]').length).toBe(1);
    service.settle(service.requests()[0].id, { confirmed: true, reason: 'Requested' });
    expect(await result).toEqual({ confirmed: true, ok: true, reason: 'Requested' }); service.cancelAll(); expect((await info).confirmed).toBeFalse();
  });
});
