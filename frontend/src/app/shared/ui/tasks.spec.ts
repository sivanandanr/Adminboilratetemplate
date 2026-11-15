import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartBackgroundTasks, TaskService } from './tasks';

describe('Background task panel composition', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
    it('shares progress/status components and offers minimize/terminal-only clearing', () => {
        const fixture = TestBed.createComponent(SmartBackgroundTasks), service = TestBed.inject(TaskService), handle = service.start({ title: 'Importing members.csv', unit: 'rows', total: 10000, run: () => undefined }); handle.progress(3144, undefined, 9); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(host.textContent).toContain('Background tasks (1 running)'); expect(host.querySelector('smart-progress-bar')).not.toBeNull(); expect(host.querySelector('[aria-label="Clear finished tasks"]')).toBeNull();
        host.querySelector<HTMLButtonElement>('[aria-label="Minimize background tasks"]')!.click(); fixture.detectChanges(); expect(host.querySelector('.rows')?.hasAttribute('hidden')).toBeTrue(); handle.complete(); fixture.detectChanges(); expect(host.querySelector('[aria-label="Clear finished tasks"]')).not.toBeNull();
    });
    it('reserves measured scroll clearance while visible and restores it on destruction', async () => {
        const root=document.documentElement, previous=root.style.getPropertyValue('--iam-tasks-clearance');
        const fixture=TestBed.createComponent(SmartBackgroundTasks), service=TestBed.inject(TaskService);
        service.start({title:'Exporting records',run:()=>undefined});fixture.detectChanges();await new Promise(resolve=>setTimeout(resolve,30));
        const expanded=parseFloat(root.style.getPropertyValue('--iam-tasks-clearance'));expect(expanded).toBeGreaterThan(24);
        service.minimized.set(true);fixture.detectChanges();await new Promise(resolve=>setTimeout(resolve,30));expect(parseFloat(root.style.getPropertyValue('--iam-tasks-clearance'))).toBeLessThan(expanded);
        fixture.destroy();expect(root.style.getPropertyValue('--iam-tasks-clearance')).toBe(previous);
    });

});
