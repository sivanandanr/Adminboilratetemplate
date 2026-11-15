import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from '../button';
import { SmartTooltip } from './tooltip';
@Component({ imports: [Button, SmartTooltip], template: `<button iamButton tooltip="Existing hint">Save</button><button iamButton smartTooltip="Explicit hint">Help</button><button smartTooltip="Standalone hint">More help</button>` })
class TooltipExample {}
describe('Tooltip composition', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  it('supports both the existing directive API and the Button fallback, with Escape dismissal', () => {
    const fixture = TestBed.createComponent(TooltipExample); fixture.detectChanges(); const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    buttons[0].dispatchEvent(new FocusEvent('focusin')); expect(document.querySelector('[role=tooltip]')?.textContent).toBe('Existing hint'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    buttons[1].dispatchEvent(new FocusEvent('focusin')); expect(document.querySelector('[role=tooltip]')?.textContent).toBe('Explicit hint'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); buttons[2].dispatchEvent(new FocusEvent('focusin')); expect(document.querySelector('[role=tooltip]')?.textContent).toBe('Standalone hint'); fixture.destroy(); expect(document.querySelector('[role=tooltip]')).toBeNull();
  });
});
