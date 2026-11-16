import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationStore } from '../../core/notifications/notification.store';
import { SmartNotificationBell, SmartNotificationCenter, SmartNotificationPanel } from './notifications';

describe('Part 1 notification composition', () => {
  const markRead = jasmine.createSpy(); const filter = jasmine.createSpy();
  const store = { busy: signal(false), loading: signal(false), failure: signal(''), unreadCount: signal(1), nextCursor: signal(undefined), category: signal(undefined), unreadOnly: signal(false), items: signal([{ id: 'one', title: 'Review access', message: 'A review is due.', category: 'approval', createdAt: 0, read: false }]), markRead, filter };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: NotificationStore, useValue: store }] }));
  it('reuses toast tone icons without replacing read/unread actions with transient messages', () => {
    const fixture = TestBed.createComponent(SmartNotificationPanel); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('li smart-feedback-icon [data-tone=info]')).not.toBeNull(); expect(host.textContent).toContain('Approval tasks');
    Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes('Mark read'))!.click(); expect(markRead).toHaveBeenCalledWith('one', true);
  });
  it('preserves bell opening, Escape close and focus return', () => {
    const fixture = TestBed.createComponent(SmartNotificationBell); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button')!; button.click(); fixture.detectChanges(); expect(button.getAttribute('aria-expanded')).toBe('true');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges(); expect(button.getAttribute('aria-expanded')).toBe('false'); expect(document.activeElement).toBe(button);
  });
  it('retains the center category and unread filtering controls', () => {
    const fixture = TestBed.createComponent(SmartNotificationCenter); fixture.detectChanges(); const host = fixture.nativeElement as HTMLElement;
    const category = host.querySelector('select')!; category.value = 'approval'; category.dispatchEvent(new Event('change')); expect(filter).toHaveBeenCalledWith('approval', false);
    expect(host.querySelector('smart-notification-panel')).not.toBeNull();
  });
});
