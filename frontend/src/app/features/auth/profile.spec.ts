import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Profile } from './profile';
import { authTestProviders } from '../../core/auth/auth-test.providers';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AUTH_PROVIDER } from '../../core/auth/auth.models';

describe('My Profile', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Profile], providers: [provideZonelessChangeDetection(), provideRouter([]), ...authTestProviders()] });
    await TestBed.inject(AuthFacade).initialize();
  });
  it('rejects invalid email without sending a profile mutation', async () => {
    const provider = TestBed.inject(AUTH_PROVIDER); const save = spyOn(provider, 'updateProfile').and.callThrough();
    const fixture = TestBed.createComponent(Profile); fixture.detectChanges(); await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const email = host.querySelector<HTMLInputElement>('#profile-email')!;
    email.value = 'invalid'; email.dispatchEvent(new Event('input')); fixture.detectChanges();
    host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); fixture.detectChanges();
    expect(host.textContent).toContain('Enter a valid email address.'); expect(save).not.toHaveBeenCalled();
  });
});
