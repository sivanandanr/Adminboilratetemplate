import { HttpContext, HttpContextToken } from '@angular/common/http';
import { BlockUiOptions } from './block-ui.service';

export interface RequestFeedbackOptions extends BlockUiOptions {
    readonly blockUi?: boolean;
    /** POST search endpoints are reads; polling/renewal must not block or keep idle active. */
    readonly mode?: 'read' | 'background';
    readonly errorToast?: boolean;
    readonly connectionProbe?: boolean;
}
export const REQUEST_FEEDBACK = new HttpContextToken<RequestFeedbackOptions>(() => ({}));
export function requestFeedback(options: RequestFeedbackOptions): HttpContext { return new HttpContext().set(REQUEST_FEEDBACK, options); }
