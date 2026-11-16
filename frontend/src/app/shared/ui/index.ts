export * from './textbox';
export * from './password';
export * from './textarea';
export * from './number-input';
export * from './dropdown';
export * from './autocomplete';
export * from './multi-select';
export * from './checkbox';
export * from './radio-group';
export * from './toggle';
export * from './date-picker';
export * from './date-range-picker';
export * from './file-upload';
export * from './form-field';
export * from './actions';
export * from './display';
export * from './tabs';
export * from './accordion';
export * from './tooltip';
export * from './breadcrumb';
export * from './drawer';
// Existing primitives stay authoritative; aliases avoid duplicate implementations.
export { PageHeader as SmartPageHeader } from '../page-header';
export { FeedbackState as SmartEmptyState } from '../feedback-state';
export { CanDirective as SmartPermission } from '../../core/auth/can.directive';

export * from './toast';
export * from './modal';
export * from './dialogs';
export * from './progress';
export * from './notifications';
export * from './wizard';

export * from './feedback-icon';
export { DialogService, ConfirmationService } from '../../core/feedback/dialog.service';
export type { ConfirmOptions, ConfirmResult, MessageBoxOptions } from '../../core/feedback/dialog.service';
export { ToastService } from '../../core/feedback/toast.service';
export type { ToastOptions, ToastItem, FeedbackTone } from '../../core/feedback/toast.service';
export { ButtonGroupState } from '../button';
export type { ButtonVariant, ButtonEmphasis } from '../button';

export * from './block-ui';
export * from './offline-banner';
export * from './tasks';
export { REQUEST_FEEDBACK, requestFeedback } from '../../core/feedback/request-feedback-context';
export type { RequestFeedbackOptions } from '../../core/feedback/request-feedback-context';
export { ApiTaskProvider, TASK_API_CONFIG } from '../../core/feedback/task.provider';
export type { TaskApiConfig } from '../../core/feedback/task.provider';

export * from './forms';
export { DirtyFormGuard } from '../../core/feedback/dirty-form.guard';

export * from './app-footer';
export * from './table';
