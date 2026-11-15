import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../../core/feedback/toast.service';
import { SmartToast, SmartToastContainer } from './toast';

describe('Part 1 toast timing and interaction', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('uses 5s and 9s defaults and caps visible messages at three', () => {
    jasmine.clock().install(); jasmine.clock().mockDate(new Date());
    try {
      const service = TestBed.inject(ToastService); service.success('Saved'); service.info('Information'); service.warning('Check'); service.error('Failed');
      expect(service.items().map(item => item.title)).toEqual(['Information', 'Check', 'Failed']);
      jasmine.clock().tick(4999); expect(service.items().length).toBe(3); jasmine.clock().tick(1); expect(service.items().length).toBe(2);
      jasmine.clock().tick(4000); expect(service.items()).toEqual([]);
    } finally { jasmine.clock().uninstall(); }
  });
  it('resumes the remaining duration only after both hover and focus leave', () => {
    jasmine.clock().install(); jasmine.clock().mockDate(new Date());
    try {
      const fixture = TestBed.createComponent(SmartToastContainer); const service = TestBed.inject(ToastService); service.info('Saved'); fixture.detectChanges();
      const article = (fixture.nativeElement as HTMLElement).querySelector('article')!;
      jasmine.clock().tick(2000); article.dispatchEvent(new MouseEvent('mouseenter')); article.dispatchEvent(new FocusEvent('focusin'));
      jasmine.clock().tick(10000); article.dispatchEvent(new MouseEvent('mouseleave')); jasmine.clock().tick(10000); expect(service.items().length).toBe(1);
      article.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body })); jasmine.clock().tick(2999); expect(service.items().length).toBe(1); jasmine.clock().tick(1); expect(service.items()).toEqual([]);
    } finally { jasmine.clock().uninstall(); }
  });
  it('announces error feedback urgently and uses the shared tone icon', () => {
    const fixture = TestBed.createComponent(SmartToast); fixture.componentRef.setInput('item', { id: 1, tone: 'error', title: '<script>private</script>' }); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement; expect(host.querySelector('article')?.getAttribute('role')).toBe('alert'); expect(host.querySelector('article')?.getAttribute('aria-live')).toBe('assertive'); expect(host.querySelector('script')).toBeNull(); expect(host.querySelector('smart-feedback-icon')).not.toBeNull();
  });
  it('uses a plain dismiss control and stacks messages without a toolbar card', () => {
    const fixture = TestBed.createComponent(SmartToastContainer); const service = TestBed.inject(ToastService);
    service.show({ title: 'Request approved', tone: 'success', durationMs: 0 }); service.show({ title: 'Provisioning failed', tone: 'error', durationMs: 0 }); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('button').length).toBe(2);
    const close = host.querySelector<HTMLButtonElement>('.toast-close')!;
    expect(close.hasAttribute('iamButton')).toBeFalse(); expect(getComputedStyle(close).borderWidth).toBe('0px');
    close.click(); fixture.detectChanges(); expect(host.querySelectorAll('smart-toast').length).toBe(1);
  });
});
