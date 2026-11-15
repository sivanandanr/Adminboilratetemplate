import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../../core/feedback/dialog.service';
import { SmartActionToolbar, SmartButton, SmartButtonGroup } from './actions';

@Component({ imports: [SmartButtonGroup, SmartButton, SmartActionToolbar], template: `<smart-button-group label="Actions"><smart-button label="Save" variant="primary" /><smart-button label="Publish" variant="success" /></smart-button-group><smart-action-toolbar [dirty]="true"><smart-button primaryAction label="Save changes" variant="primary" /><smart-button cancelAction label="Cancel" /><smart-button label="Preview" /></smart-action-toolbar>` })
class ActionsExample {}
describe('Part 1 action composition', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('keeps one solid action per group and orders footer actions after the dirty status', () => {
    const fixture = TestBed.createComponent(ActionsExample); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('smart-button-group .button-solid').length).toBe(1);
    expect(Array.from(host.querySelectorAll('smart-action-toolbar button')).map(button => button.textContent?.trim())).toEqual(['Preview', 'Cancel', 'Save changes']);
    expect(host.querySelector('.unsaved-pill')?.textContent).toContain('Unsaved changes');
  });
  it('exposes a disabled reason on keyboard focus and blocks click/submit', () => {
    const fixture = TestBed.createComponent(SmartButton);
    fixture.componentRef.setInput('label', 'Save'); fixture.componentRef.setInput('disabled', true); fixture.componentRef.setInput('disabledReason', 'Complete the required fields.'); fixture.detectChanges();
    const pressed = jasmine.createSpy(); fixture.componentInstance.pressed.subscribe(pressed);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeFalse(); expect(button.getAttribute('aria-disabled')).toBe('true');
    button.dispatchEvent(new FocusEvent('focusin')); expect(document.querySelector('[role=tooltip]')?.textContent).toBe('Complete the required fields.');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true }); button.dispatchEvent(click);
    expect(click.defaultPrevented).toBeTrue(); expect(pressed).not.toHaveBeenCalled();
  });
  it('requires confirmation for a typed semantic action and suppresses duplicate requests', async () => {
    const fixture = TestBed.createComponent(SmartButton); fixture.componentRef.setInput('label', 'Approve'); fixture.componentRef.setInput('action', 'approve'); fixture.detectChanges();
    const pressed = jasmine.createSpy(); fixture.componentInstance.pressed.subscribe(pressed);
    const pending = fixture.componentInstance.activate(); void fixture.componentInstance.activate();
    const dialogs = TestBed.inject(DialogService); expect(dialogs.requests().length).toBe(1);
    dialogs.settle(dialogs.requests()[0].id, { confirmed: false }); await pending; expect(pressed).not.toHaveBeenCalled();
    const approved = fixture.componentInstance.activate(); dialogs.settle(dialogs.requests()[0].id, { confirmed: true }); await approved; expect(pressed).toHaveBeenCalledTimes(1);
  });
  it('preserves the label footprint and accessible name while loading', () => {
    const fixture = TestBed.createComponent(SmartButton); fixture.componentRef.setInput('label', 'Save changes'); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement; const button = host.querySelector('button')!;
    const width = button.getBoundingClientRect().width;
    fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    expect(host.querySelector('.button-content.busy')?.textContent).toContain('Save changes');
    expect(button.getBoundingClientRect().width).toBe(width); expect(button.disabled).toBeTrue(); expect(button.getAttribute('aria-label')).toBe('Save changes');
  });
});
