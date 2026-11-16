import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';
export interface AppFooterLink { readonly label: string; readonly href: string | null; }
export interface AppMetadata { readonly product: string; readonly version: string; readonly environment: string; readonly links: readonly AppFooterLink[]; }
/** Override at deployment with approved legal/support destinations. No invented policy documents. */
export const APP_METADATA = new InjectionToken<AppMetadata>('APP_METADATA', { providedIn: 'root', factory: () => ({
 product: 'SmartIAM', version: '0.0.0', environment: environment.production ? 'Production' : 'Development',
 links: [{label:'Privacy',href:null},{label:'Terms',href:null},{label:'Help',href:null}],
}) });
