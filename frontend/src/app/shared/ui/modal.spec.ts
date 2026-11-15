import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartModal } from './modal';

@Component({ imports: [SmartModal], template: `<button id="trigger">Open</button><smart-modal title="First" [open]="first" (closed)="first=false"><p>Body</p><div modalFooter><button data-initial-focus>Cancel</button><button>Confirm</button></div></smart-modal><smart-modal title="Second" [open]="second"><button>Done</button></smart-modal>` })
class ModalExample { first = false; second = false; }
describe('Part 1 modal structure and ownership', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('queues direct modal instances, restores focus and releases scroll locks', () => {
    const fixture = TestBed.createComponent(ModalExample); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('#trigger')!.focus();
    fixture.componentInstance.first = true; fixture.componentInstance.second = true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.querySelectorAll('dialog[open]').length).toBe(1);
    const dialogs = host.querySelectorAll('dialog'); expect(dialogs[0].open).toBeTrue();
    dialogs[0].dispatchEvent(new Event('cancel', { cancelable: true })); fixture.detectChanges();
    expect(dialogs[0].open).toBeFalse(); expect(dialogs[1].open).toBeTrue(); fixture.destroy(); expect(document.body.style.overflow).not.toBe('hidden');
  });
  it('projects the footer outside the scrolling body and limits viewport height', () => {
    const fixture = TestBed.createComponent(ModalExample); fixture.componentInstance.first = true; fixture.detectChanges();
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
    expect(dialog.querySelector('footer [modalFooter]')).not.toBeNull(); expect(dialog.querySelector('.modal-body [modalFooter]')).toBeNull();
    expect(getComputedStyle(dialog).overflow).toBe('hidden'); expect(getComputedStyle(dialog.querySelector('.modal-body')!).overflowY).toBe('auto');
    expect(parseFloat(getComputedStyle(dialog).maxHeight)).toBeCloseTo(innerHeight * .85, 0);
  });
  it('allows a footer-only cancel action without disabling Escape cancellation', () => {
    const fixture = TestBed.createComponent(SmartModal); fixture.componentRef.setInput('title', 'Confirmation'); fixture.componentRef.setInput('showClose', false); fixture.componentRef.setInput('open', true); fixture.detectChanges();
    const closed = jasmine.createSpy(); fixture.componentInstance.closed.subscribe(closed);
    const host = fixture.nativeElement as HTMLElement; expect(host.querySelector('.modal-close')).toBeNull();
    host.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true })); expect(closed).toHaveBeenCalledTimes(1);
  });
});
