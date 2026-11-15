import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Icon } from '../shared/icon';
import { Breadcrumb, NavigationGroup, PageMetadata, navigationGroups } from './navigation';
import { ThemeService } from './theme.service';
import { AuthFacade } from '../core/auth/auth.facade';
import { requiredForPath } from '../core/auth/auth.models';
import { CanDirective } from '../core/auth/can.directive';
import { SmartNotificationBell } from '../shared/ui/notifications';

import { SmartRouteProgress } from '../shared/ui/progress';
import { SmartBreadcrumb } from '../shared/ui/breadcrumb';
import { SmartAppFooter } from '../shared/ui/app-footer';
import { SmartOfflineBanner } from '../shared/ui/offline-banner';

type HeaderPopover = 'profile';
@Component({
  selector: 'iam-admin-shell',
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet, CanDirective, SmartNotificationBell, SmartRouteProgress, SmartOfflineBanner, SmartAppFooter, SmartBreadcrumb],
  templateUrl: './admin-shell.html',
  styleUrls: ['./admin-shell.css', './header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private hasCompletedNavigation = false;
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthFacade);
  private readonly contextReady = signal(false);
  protected readonly groups = computed(() => navigationGroups.map((group) => ({ ...group, items: group.items.filter((item) => this.auth.canAll(requiredForPath(item.path))) })).filter((group) => group.items.length));
  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set(['administration']));
  protected readonly currentPath = signal('/administration');
  protected readonly activeItemPath = computed(() => this.groups().flatMap(group=>group.items).map(item=>item.path).filter(path=>this.currentPath()===path||this.currentPath().startsWith(path+'/')).sort((left,right)=>right.length-left.length)[0]);
  protected readonly breadcrumbs = signal<readonly Breadcrumb[]>([{ label: 'Administration' }]);
  protected readonly popover = signal<HeaderPopover | null>(null);
  protected readonly searchMessage = signal('');
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('closeMenu') private closeMenu?: ElementRef<HTMLButtonElement>;
  @ViewChild('main') private main?: ElementRef<HTMLElement>;
  @ViewChild('profileTrigger') private profileTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('pageSearch') private pageSearch?: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      if (this.contextReady() && this.auth.isAuthenticated() && !this.auth.permissionsLoading() && !this.auth.canAll(requiredForPath(this.currentPath()))) void this.router.navigateByUrl('/access-denied');
    });
    const originalOverflow = this.document.body.style.overflow;
    effect(() => { this.document.body.style.overflow = this.mobileOpen() ? 'hidden' : originalOverflow; });
    this.destroyRef.onDestroy(() => { this.document.body.style.overflow = originalOverflow; });
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => {
      this.updateContext();
      this.main?.nativeElement.scrollTo({top:0,left:0});
      this.contextReady.set(true);
      this.popover.set(null);
      this.searchMessage.set('');
      this.closeNavigation(false);
      // Keep initial browser focus at the start; announce later route changes via main.
      if (this.hasCompletedNavigation) this.focusAfterRender(this.main);
      this.hasCompletedNavigation = true;
    });
  }

  protected updateContext(): void {
    this.currentPath.set(this.router.url.split(/[?#]/)[0]);
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const metadata = route.data as Partial<PageMetadata>;
    this.breadcrumbs.set(metadata.breadcrumbs ?? [{ label: metadata.label ?? 'Administration' }]);
    const active = this.groups().find((group) => this.isActive(group));
    if (active) this.expanded.update((ids) => new Set([...ids, active.id]));
  }

  protected isActive(group: NavigationGroup): boolean {
    return group.items.some((item) => item.path === this.activeItemPath());
  }

  protected toggleGroup(id: string): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.expanded.update((ids) => new Set([...ids, id]));
      return;
    }
    this.expanded.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  protected toggleNavigation(): void {
    this.popover.set(null);
    if (window.matchMedia('(max-width: 767px)').matches) {
      this.collapsed.set(false);
      this.mobileOpen.update((open) => !open);
      if (this.mobileOpen()) this.focusAfterRender(this.closeMenu);
    } else this.collapsed.update((collapsed) => !collapsed);
  }

  protected closeNavigation(restoreFocus = true): void {
    if (!this.mobileOpen()) return;
    this.mobileOpen.set(false);
    if (restoreFocus) this.focusAfterRender(this.menuToggle);
  }

  protected togglePopover(name: HeaderPopover): void {
    this.popover.update((current) => current === name ? null : name);
  }

  protected findPage(event: Event, query: string): void {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;
    const pages = this.groups().flatMap((group) => group.items);
    const match = pages.find((page) => page.label.toLowerCase() === normalized)
      ?? pages.find((page) => page.label.toLowerCase().includes(normalized));
    if (match) {
      this.searchMessage.set('');
      void this.router.navigateByUrl(match.path);
    } else this.searchMessage.set('No matching page. Try “Roles” or “System”.');
  }

  @HostListener('document:click', ['$event']) protected onOutsideClick(event: Event): void {
    if (event.target instanceof Element && !event.target.closest('[data-header-popover]')) this.popover.set(null);
  }

  @HostListener('document:keydown.escape') protected onEscape(): void {
    const open = this.popover();
    this.popover.set(null);
    if (open) this.focusAfterRender(this.profileTrigger);
    this.closeNavigation();
  }

  @HostListener('document:keydown', ['$event']) protected onKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && this.pageSearch?.nativeElement.getClientRects().length) {
      event.preventDefault(); this.pageSearch.nativeElement.focus();
    }
    if (event.key !== 'Tab' || !this.mobileOpen()) return;
    const controls = Array.from(this.closeMenu!.nativeElement.closest('aside')!.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a, button'))
      .filter((control) => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  @HostListener('window:resize') protected onResize(): void {
    if (!window.matchMedia('(max-width: 767px)').matches) this.mobileOpen.set(false);
  }

  private focusAfterRender(element?: ElementRef<HTMLElement>): void {
    setTimeout(() => { if (!this.destroyRef.destroyed) element?.nativeElement.focus({ preventScroll: true }); });
  }
}
