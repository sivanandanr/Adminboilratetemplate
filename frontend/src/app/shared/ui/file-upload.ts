import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
import { Button } from '../button';
import { Icon } from '../icon';
import { SmartProgressBar, SmartProgressStatus } from './progress';
import { formatByteProgress, formatBytes } from '../../core/feedback/progress-format';
export interface FileUploadState { readonly file: File; readonly status: 'uploading' | 'checking' | 'ready' | 'failed' | 'cancelled'; readonly loaded?: number; readonly total?: number; readonly message?: string; readonly canCancel?: boolean; }
@Component({
 selector: 'smart-file-upload', imports: [SmartFormField, Button, Icon, SmartProgressBar, SmartProgressStatus],
 hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }],
 template: `
  <smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="helpText()" [required]="field.required()" [errors]="messages()">
    <input #picker class="smart-input" type="file" [id]="field.id()" [accept]="accept()" [multiple]="multiple()"
      [disabled]="field.isDisabled() || active()" [attr.aria-readonly]="field.readonly()"
      [attr.aria-invalid]="messages().length > 0" [attr.aria-describedby]="describedBy()"
      (click)="lock($event)" (change)="select($event)" (blur)="field.blur()" />
    <ul>
      @for (file of field.value() ?? []; track $index) {
        <li><div class="upload-heading"><strong>{{ file.name }}</strong><span class="file-size">{{ size(file.size) }}</span>
          @if (state(file); as upload) { <smart-progress-status [state]="progressState(upload)" [label]="statusLabel(upload)" /> }
        </div>
        @if (state(file); as upload) {
          <smart-progress-bar [label]="'Upload ' + file.name" [status]="progressState(upload)" [percentage]="percentage(upload)"
            [text]="upload.status === 'ready' ? upload.message || 'Uploaded and checked.' : upload.status === 'failed' || upload.status === 'cancelled' ? '' : counts(upload)" />
          @if (upload.status === 'failed') { <p class="upload-error" role="alert">{{ upload.message || 'Upload failed. Check the file type, size and connection, then choose the file again.' }}</p> }
          @if ((upload.status === 'uploading' || upload.status === 'checking') && upload.canCancel) {
            <div class="upload-actions"><button iamButton type="button" size="small" [disabled]="field.isDisabled() || field.readonly()" (click)="cancelled.emit(file)"><iam-icon name="X" [size]="16" />Cancel</button></div>
          }
        }
        </li>
      }
    </ul>
    @if (field.value()?.length && !active()) { <button iamButton type="button" [disabled]="field.isDisabled() || field.readonly()" (click)="clear()"><iam-icon name="X" [size]="16" />Clear files</button> }
  </smart-form-field>`,
 styles: `ul { list-style:none; padding:0; margin:8px 0; }li { padding:12px; margin-top:8px; border:1px solid var(--iam-feedback-border); border-radius:var(--iam-radius-lg); } .upload-heading { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; }strong { min-width:0; overflow-wrap:anywhere; font-size:var(--iam-font-sm); }.file-size { color:var(--iam-feedback-muted); font-size:var(--iam-font-xs); }smart-progress-status { margin-left:auto; }.upload-actions { display:flex; justify-content:flex-end; margin-top:6px; }.upload-error { color:var(--iam-feedback-danger-text); font-size:var(--iam-font-sm); margin:8px 0 0; }`,
 changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartFileUpload {
 readonly field = inject<SmartValueAccessor<readonly File[]>>(SmartValueAccessor);
 readonly uploads = input<readonly FileUploadState[]>([]);
 readonly cancelled = output<File>();
 readonly active = computed(() => this.uploads().some(upload => upload.status === 'uploading' || upload.status === 'checking'));
 readonly size = formatBytes;
 readonly helpText = computed(() => `${this.field.hint() ? this.field.hint() + ' ' : ''}Allowed types: ${this.accept() || 'any file type'}. Maximum ${formatBytes(this.maxBytes())} per file${this.multiple() ? ', up to ' + this.maxFiles() + ' files' : ''}.`);
 readonly describedBy = computed(() => `${this.field.id()}-hint${this.messages().length ? ' ' + this.field.id() + '-error' : ''}`);
 state(file: File): FileUploadState | undefined { return this.uploads().find(upload => upload.file === file); }
 progressState(upload: FileUploadState): 'running' | 'completed' | 'failed' | 'cancelled' { return upload.status === 'ready' ? 'completed' : upload.status === 'failed' || upload.status === 'cancelled' ? upload.status : 'running'; }
 statusLabel(upload: FileUploadState): string { return ({ uploading: 'Uploading', checking: 'Checking', ready: 'Ready', failed: 'Failed', cancelled: 'Cancelled' })[upload.status]; }
 percentage(upload: FileUploadState): number | null {
  const {loaded, total} = upload;
  return upload.status === 'uploading' && loaded !== undefined && total !== undefined && Number.isFinite(loaded) && Number.isFinite(total) && total > 0 && loaded >= 0 && loaded <= total ? loaded / total * 100 : null;
 }
 counts(upload: FileUploadState): string { return upload.status === 'checking' ? 'Checking the uploaded file' : upload.loaded !== undefined && upload.total !== undefined && this.percentage(upload) !== null ? formatByteProgress(upload.loaded, upload.total) : 'Waiting for upload progress'; }
 readonly accept = input(''); readonly multiple = input(false); readonly maxBytes = input(10 * 1024 * 1024); readonly maxFiles = input(10);
 private readonly rejection = signal<readonly string[]>([]);
 readonly messages = () => [...this.field.messages(), ...this.rejection()];
 @ViewChild('picker') private picker?: ElementRef<HTMLInputElement>;
 constructor() { effect(() => { if (!this.field.value()?.length && this.picker) this.picker.nativeElement.value = ''; }); }
 lock(event: Event): void { if (this.field.readonly() || this.active()) event.preventDefault(); }
 select(event: Event): void {
  const element = event.target as HTMLInputElement; const files = Array.from(element.files ?? []);
  if (this.field.readonly() || this.field.isDisabled() || this.active()) { element.value = ''; return; }
  const accepted = this.accept().split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const mismatch = files.some(file => accepted.length && !accepted.some(rule => rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : rule.endsWith('/*') ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule));
  const errors = files.length > (this.multiple() ? this.maxFiles() : 1) ? [`Choose ${this.multiple() ? this.maxFiles() : 1} file${this.multiple() ? 's' : ''} or fewer.`] : files.some(file => file.size > this.maxBytes()) ? [`Choose a file no larger than ${formatBytes(this.maxBytes())}.`] : mismatch ? [`Choose a supported file type: ${this.accept()}.`] : [];
  this.rejection.set(errors); if (!errors.length) this.field.commit(files); element.value = ''; this.field.blur();
 }
 clear(): void { if (this.active() || this.field.isDisabled() || this.field.readonly()) return; this.field.commit([]); this.rejection.set([]); this.field.blur(); }
}
