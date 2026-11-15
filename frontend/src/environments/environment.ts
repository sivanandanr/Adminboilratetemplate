import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { productionAuthConfig } from '../app/core/auth/auth.config';
import { BffAuthProvider } from '../app/core/auth/bff-auth.provider';
import { ApiNotificationProvider } from '../app/core/notifications/api-notification.provider';
import { ApiDashboardProvider } from '../app/shared/dashboard/api-dashboard.provider';
import { ApiRecordsProvider } from '../app/features/records/api-records.provider';

export const environment = { production: true, auth: productionAuthConfig, createAuthProvider: () => inject(BffAuthProvider), createNotificationProvider: () => inject(ApiNotificationProvider), createDashboardProvider:()=>inject(ApiDashboardProvider),createRecordsProvider:()=>inject(ApiRecordsProvider), developmentInterceptors: [] as HttpInterceptorFn[] };
export const developmentRoutes: Routes = [];
