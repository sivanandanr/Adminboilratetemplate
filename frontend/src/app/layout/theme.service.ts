import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<Theme>('light');
  readonly theme = this.selected.asReadonly();

  constructor() {
    effect(() => { this.document.documentElement.dataset['theme'] = this.selected(); });
  }

  toggle(): void { this.selected.update((theme) => theme === 'light' ? 'dark' : 'light'); }
}
