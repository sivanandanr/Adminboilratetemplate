import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminShell } from './admin-shell';
import { authTestProviders } from '../core/auth/auth-test.providers';
import { AuthFacade } from '../core/auth/auth.facade';
describe('AdminShell', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [AdminShell], providers: [provideZonelessChangeDetection(), provideRouter([]), ...authTestProviders()] });
    await TestBed.inject(AuthFacade).initialize();
  });
  it('collapses navigation and reopens it through the Administration control', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[aria-label="Toggle navigation"]')!.click(); fixture.detectChanges();
    expect(host.querySelector('.shell')!.classList.contains('collapsed')).toBeTrue();
    host.querySelector<HTMLButtonElement>('button[title="Administration"]')!.click(); fixture.detectChanges();
    expect(host.querySelector('.shell')!.classList.contains('collapsed')).toBeFalse();
    expect(host.querySelector('#administration-links')!.hasAttribute('hidden')).toBeFalse();
  });
  it('closes mobile navigation on Escape', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const fixture = TestBed.createComponent(AdminShell); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[aria-label="Toggle navigation"]')!.click(); fixture.detectChanges();
    expect(host.querySelector('.workspace')!.hasAttribute('inert')).toBeTrue();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(host.querySelector('.shell')!.classList.contains('mobile-open')).toBeFalse();
  });
});
