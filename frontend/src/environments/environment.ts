import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { productionAuthConfig } from '../app/core/auth/auth.config';
import { BffAuthProvider } from '../app/core/auth/bff-auth.provider';

export const environment = { production: true, auth: productionAuthConfig, createAuthProvider: () => inject(BffAuthProvider) };
export const developmentRoutes: Routes = [];
