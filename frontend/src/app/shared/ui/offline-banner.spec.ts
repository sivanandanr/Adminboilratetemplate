import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConnectionService, SmartOfflineBanner } from './offline-banner';

describe('Connection banner and safe retries', () => {
    beforeEach(() => { jasmine.clock().install(); TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }); });
    afterEach(() => { TestBed.resetTestingModule(); jasmine.clock().uninstall(); });
    it('shows the exact offline copy/countdown and hides only after recovery', async () => {
        const fixture = TestBed.createComponent(SmartOfflineBanner), connection = TestBed.inject(ConnectionService), probe = jasmine.createSpy().and.resolveTo(false); connection.setProbe(probe); connection.unreachable(); fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement; expect(host.textContent).toContain("Can't reach the server. Your work on this page is safe, but changes can't be saved yet."); jasmine.clock().tick(2000); fixture.detectChanges(); expect(host.textContent).toContain('Retrying in 3 seconds.');
        await connection.retry(); expect(connection.reachable()).toBeFalse(); probe.and.resolveTo(true); await connection.retry(); fixture.detectChanges(); expect(host.querySelector('aside')).toBeNull();
    });
    it('probes automatically after the countdown and never runs two probes at once', async () => {
        let resolve!: (value: boolean) => void; const connection = TestBed.inject(ConnectionService), probe = jasmine.createSpy().and.returnValue(new Promise<boolean>(done => resolve = done)); connection.setProbe(probe); connection.unreachable(); jasmine.clock().tick(5000); void connection.retry(); expect(probe).toHaveBeenCalledTimes(1); resolve(true); await Promise.resolve(); expect(connection.reachable()).toBeTrue();
    });
});
