import { Injectable, inject } from '@angular/core';
import { AUTH_CONFIG } from './auth.config';

@Injectable({ providedIn: 'root' })
export class UsernamePreference {
  private readonly config = inject(AUTH_CONFIG);
  private readonly key = 'smartiam.rememberedUsername';
  read(): string {
    if (!this.config.rememberUsername) return '';
    try { return (localStorage.getItem(this.key) ?? '').slice(0, 128); } catch { return ''; }
  }
  save(username: string, remember: boolean): void {
    if (!this.config.rememberUsername) return;
    try { if (remember) localStorage.setItem(this.key, username.slice(0, 128)); else localStorage.removeItem(this.key); } catch { /* Optional preference; sign-in must still work. */ }
  }
}
