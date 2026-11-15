import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Icon } from './icon';
describe('Icon', () => {
  it('renders a decorative SVG with the configured size', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'Shield');
    fixture.componentRef.setInput('size', 28);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('lucide-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('svg')!.getAttribute('width')).toBe('28');
  });
});
