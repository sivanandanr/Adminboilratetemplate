import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartProgressBar, SmartProgressStatus } from './progress';

describe('One shared progress bar', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
    it('uses an 8px track and omits numeric ARIA for unknown duration', () => {
        const fixture = TestBed.createComponent(SmartProgressBar); fixture.componentRef.setInput('label', 'Saving'); fixture.detectChanges();
        const bar = (fixture.nativeElement as HTMLElement).querySelector('[role=progressbar]')!;
        expect(getComputedStyle(bar).height).toBe('8px'); expect(bar.hasAttribute('aria-valuenow')).toBeFalse(); expect(bar.hasAttribute('aria-valuemin')).toBeFalse(); expect(bar.hasAttribute('aria-valuemax')).toBeFalse();
    });
    it('shows confirmed counts, ETA and all states including legacy aliases', () => {
        const fixture = TestBed.createComponent(SmartProgressBar); fixture.componentRef.setInput('label', 'Import'); fixture.componentRef.setInput('completed', 3353); fixture.componentRef.setInput('total', 10000); fixture.componentRef.setInput('unit', 'rows'); fixture.componentRef.setInput('etaSeconds', 8); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(host.textContent).toContain('3,353 of 10,000 rows'); expect(host.textContent).toContain('about 8s left'); expect(host.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('34');
        for (const [status, state] of [['success', 'completed'], ['error', 'failed'], ['completed', 'completed'], ['failed', 'failed'], ['cancelled', 'cancelled']]) {
            fixture.componentRef.setInput('status', status); fixture.detectChanges(); expect(host.querySelector('[role=progressbar]')?.getAttribute('data-state')).toBe(state);
        }
    });
    it('renders a thin read indicator without a second bar implementation', () => {
        const fixture = TestBed.createComponent(SmartProgressBar); fixture.componentRef.setInput('label', 'Reading'); fixture.componentRef.setInput('size', 'thin'); fixture.componentRef.setInput('showDetails', false); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(getComputedStyle(host.querySelector('.track')!).height).toBe('3px'); expect(host.querySelector('.progress-copy')).toBeNull();
    });
    it('renders an accessible textual status instead of color alone', () => {
        const fixture = TestBed.createComponent(SmartProgressStatus); fixture.componentRef.setInput('state', 'completed'); fixture.detectChanges(); expect((fixture.nativeElement as HTMLElement).textContent).toContain('Completed');
    });
});
