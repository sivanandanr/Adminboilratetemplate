import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedbackState } from '../../shared/feedback-state';
import { PageHeader } from '../../shared/page-header';
@Component({ selector: 'iam-access-denied', imports: [FeedbackState, PageHeader, RouterLink], template: '<iam-page-header title="Access denied" description="This account does not have access to the requested feature." icon="Shield"><a page-actions class="button" routerLink="/profile">My Profile</a></iam-page-header><iam-feedback-state kind="error" title="Permission required" description="Ask your administrator for access. Hiding controls does not replace server authorization." />', changeDetection: ChangeDetectionStrategy.OnPush })
export class AccessDenied {}
