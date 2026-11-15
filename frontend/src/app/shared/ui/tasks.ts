import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterEveryRender, afterNextRender, inject } from '@angular/core';
import { TaskService, TaskSnapshot } from '../../core/feedback/tasks.service';
import { SmartProgressBar, SmartProgressStatus } from './progress';
import { Button } from '../button';
import { Icon } from '../icon';

@Component({
    selector: 'smart-background-tasks', imports: [SmartProgressBar, SmartProgressStatus, Button, Icon],
    template: `@if (tasks.items().length || tasks.restoreError()) {
      <aside aria-label="Background tasks">
        <header><iam-icon name="Clock" [size]="18" /><h2>Background tasks@if (tasks.running()) { ({{ tasks.running() }} running) }</h2>
          <button type="button" class="panel-icon" [attr.aria-label]="tasks.minimized() ? 'Expand background tasks' : 'Minimize background tasks'" aria-controls="background-task-list" [attr.aria-expanded]="!tasks.minimized()" (click)="tasks.minimized.set(!tasks.minimized())"><iam-icon name="ChevronDown" [size]="18" /></button>
          @if (!tasks.running()) { <button type="button" class="panel-icon" aria-label="Clear finished tasks" (click)="tasks.clearFinished()"><iam-icon name="X" [size]="18" /></button> }
        </header>
        <div id="background-task-list" class="rows" [hidden]="tasks.minimized()">
          @if (tasks.restoreError()) { <p role="alert">{{ tasks.restoreError() }}</p><button iamButton type="button" (click)="tasks.restore()"><iam-icon name="RefreshCw" [size]="16" />Retry</button> }
          @for (task of tasks.items(); track task.id) {
            <section [attr.aria-label]="task.title" [attr.data-task-id]="task.id">
              <div class="task-title"><h3 tabindex="-1">{{ task.title }}</h3><smart-progress-status [state]="task.status" /></div>
              <smart-progress-bar [label]="task.title" [percentage]="task.percentage ?? null" [status]="task.status"
                [completed]="task.completed ?? null" [total]="task.total ?? null" [unit]="task.unit ?? ''" [etaSeconds]="task.etaSeconds ?? null"
                [text]="progressText(task)" />
              <div class="task-actions">
                @if (task.status === 'running' && task.canCancel) { <button iamButton type="button" size="small" [disabled]="!!task.working" (click)="cancel(task.id)">Cancel</button> }
                @if (task.status === 'completed' && task.canDownload) { <button iamButton type="button" size="small" variant="primary" [loading]="!!task.working" (click)="tasks.download(task.id)"><iam-icon name="Download" [size]="16" />Download</button> }
                @if (task.status === 'failed' && task.canRetry) { <button iamButton type="button" size="small" variant="outline" [disabled]="!!task.working" (click)="tasks.retry(task.id)"><iam-icon name="RefreshCw" [size]="16" />Retry</button> }
              </div>
            </section>
          }
        </div>
      </aside>
    }`,
    styles: `
      aside { position:fixed; right:24px; bottom:calc(var(--iam-app-footer-offset) + 16px); width:min(380px,calc(100vw - 32px));
        max-height:70dvh; display:flex; flex-direction:column; border:1px solid var(--iam-feedback-border); border-radius:var(--iam-toast-radius);
        background:var(--iam-feedback-surface); color:var(--iam-feedback-title); box-shadow:var(--iam-feedback-shadow); z-index:var(--iam-layer-tasks); }
      header { display:flex; align-items:center; gap:8px; padding:16px 14px; border-bottom:1px solid var(--iam-feedback-border); flex-shrink:0; }
      h2 { flex:1; min-width:0; font-size:var(--iam-font-md); font-weight:600; margin:0; }
      .panel-icon { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; padding:0; border:0; background:transparent; color:inherit; border-radius:var(--iam-radius-sm); }
      .panel-icon:hover { background:var(--iam-hover); }
      .rows { min-height:0; overflow:auto; padding:4px 14px 10px; }.rows[hidden] { display:none; }
      section { padding:12px 0 10px; border-bottom:1px solid var(--iam-feedback-border); }section:last-child { border:0; }
      .task-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
      h3 { margin:0; font-size:var(--iam-font-sm); font-weight:600; overflow-wrap:anywhere; }
      smart-progress-bar { --iam-progress-copy-size:var(--iam-font-xs); }
      .task-actions { display:flex; justify-content:flex-end; margin-top:6px; }
      .task-actions:empty { display:none; }button { box-shadow:none; }
      @media(max-width:760px) { aside { width:auto; left:12px; right:12px; bottom:calc(var(--iam-app-footer-offset) + 12px); } }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartBackgroundTasks {
    constructor(){
      const root=document.documentElement;const previous=root.style.getPropertyValue('--iam-tasks-clearance');
      let observed:HTMLElement|null=null;const update=()=>root.style.setProperty('--iam-tasks-clearance',`${observed ? Math.ceil(observed.getBoundingClientRect().height)+24 : 0}px`);
      const observer=new ResizeObserver(update);
      afterEveryRender(()=>{const aside=this.element.nativeElement.querySelector<HTMLElement>('aside');if(aside===observed)return;observer.disconnect();observed=aside;if(aside)observer.observe(aside);update();});
      this.destroy.onDestroy(()=>{observer.disconnect();if(previous)root.style.setProperty('--iam-tasks-clearance',previous);else root.style.removeProperty('--iam-tasks-clearance');});
    }

    readonly tasks = inject(TaskService);
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly injector = inject(Injector);
    private readonly destroy = inject(DestroyRef);
    async cancel(id: string): Promise<void> {
        const trigger = document.activeElement as HTMLElement | null;
        await this.tasks.cancel(id);
        if (this.destroy.destroyed) return;
        afterNextRender(() => {
            // Restore a declined action after its disabled state clears; completed rows have no Cancel button.
            if (document.activeElement !== document.body && document.activeElement !== trigger) return;
            if (trigger?.isConnected) trigger.focus();
            else Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('section')).find(row => row.dataset['taskId'] === id)?.querySelector<HTMLElement>('h3')?.focus();
        }, { injector: this.injector });
    }
    progressText(task: TaskSnapshot): string {
        if (task.message) return task.message;
        if (task.status === 'running') return task.completed == null || task.total == null ? 'Working on the server.' : '';
        return task.status === 'completed' ? task.canDownload ? 'Ready to download.' : 'Completed.' : task.status === 'cancelled' ? 'Task cancelled.' : 'The task failed. Check the result before retrying.';
    }
}
export { TaskService, BACKGROUND_TASK_PROVIDER } from '../../core/feedback/tasks.service';
export type { TaskHandle, TaskOptions, TaskSnapshot, TaskDownload, BackgroundTaskProvider } from '../../core/feedback/tasks.service';
