import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, ButtonVariant } from './button';
@Component({ imports: [Button], template: `<button iamButton [variant]="variant" [emphasis]="solid ? 'solid' : 'auto'" [disabled]="disabled" disabledReason="Read-only access" (click)="count=count+1">Confirm</button>` })
class VariantExample { variant: ButtonVariant = 'secondary'; solid = false; disabled = false; count = 0; }
describe('Button semantic variants', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('blocks native template click handlers when a disabled reason keeps the action focusable', () => {
    const fixture = TestBed.createComponent(VariantExample); fixture.componentInstance.disabled = true; fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeFalse(); button.click(); expect(fixture.componentInstance.count).toBe(0);
    fixture.componentInstance.disabled = false; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); button.click(); expect(fixture.componentInstance.count).toBe(1);
  });
  it('keeps dangerous actions outlined until explicitly confirming and supports success/warning', () => {
    const fixture = TestBed.createComponent(VariantExample); fixture.detectChanges(); const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    fixture.componentInstance.variant = 'danger'; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(button.classList.contains('button-solid')).toBeFalse();
    fixture.componentInstance.solid = true; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(button.classList.contains('button-solid')).toBeTrue();
    for (const variant of ['success', 'warning'] as const) { fixture.componentInstance.variant = variant; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(button.classList.contains('button-' + variant)).toBeTrue(); }
  });
});
