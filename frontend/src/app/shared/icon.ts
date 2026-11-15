import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Pencil, Clock, Check, Trash2, Info, TriangleAlert, Activity, Bell, CalendarDays, ChevronDown, ChevronRight, FileSearch, Layers, LayoutDashboard, Menu, Settings, Shield, SlidersHorizontal, Users, X, ArrowRight, Plus, RefreshCw, Sun, Moon, CircleAlert, CircleCheck, Inbox, LoaderCircle, UserRound, Search, KeyRound, Workflow, Network, ClipboardCheck, Download, EllipsisVertical, LucideAngularModule } from 'lucide-angular';

const icons = { Pencil, Clock, Check, Trash2, Info, TriangleAlert, Activity, Bell, CalendarDays, ChevronDown, ChevronRight, FileSearch, Layers, LayoutDashboard, Menu, Settings, Shield, SlidersHorizontal, Users, X, ArrowRight, Plus, RefreshCw, Sun, Moon, CircleAlert, CircleCheck, Inbox, LoaderCircle, UserRound, Search, KeyRound, Workflow, Network, ClipboardCheck, Download, EllipsisVertical };
export type IconName = keyof typeof icons;

/** Decorative icons; the enclosing control supplies its accessible name. */
@Component({
  selector: 'iam-icon', imports: [LucideAngularModule],
  template: '<lucide-icon [img]="icons[name()]" [size]="size()" [strokeWidth]="1.7" aria-hidden="true" />',
  styles: ':host { display: inline-flex; flex-shrink: 0; vertical-align: middle; }',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly icons = icons;
}
