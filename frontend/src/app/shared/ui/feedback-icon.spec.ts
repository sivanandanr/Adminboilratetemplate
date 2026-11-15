import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartFeedbackIcon } from './feedback-icon';
describe('Shared feedback tone icon', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('maps all four feedback tones to decorative icons and semantic token styles', () => {
    const fixture = TestBed.createComponent(SmartFeedbackIcon);
    for (const tone of ['success', 'info', 'warning', 'error']) {
      fixture.componentRef.setInput('tone', tone); fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement; expect(host.querySelector('span')?.getAttribute('data-tone')).toBe(tone); expect(host.querySelector('lucide-icon')?.getAttribute('aria-hidden')).toBe('true');
    }
  });
  it('uses the circular reference treatment and an action-specific trash glyph', () => {
    const fixture = TestBed.createComponent(SmartFeedbackIcon); fixture.componentRef.setInput('tone', 'error'); fixture.componentRef.setInput('name', 'Trash2'); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(getComputedStyle(host.querySelector('span')!).borderRadius).toBe('50%');
    expect(host.querySelector('svg')?.getAttribute('width')).toBe('18');
    expect(fixture.componentInstance.icon()).toBe('Trash2');
  });
});
