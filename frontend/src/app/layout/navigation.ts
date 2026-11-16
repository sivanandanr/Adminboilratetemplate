import { IconName } from '../shared/icon';
import { Permission } from '../core/auth/auth.models';
import { environment } from '../../environments/environment';

export interface NavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: IconName;
}
export interface NavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly items: readonly NavigationItem[];
}
export interface Breadcrumb { readonly label: string; readonly path?: string; }
export interface PageMetadata {
  readonly permissions?: readonly Permission[];
  readonly label: string;
  readonly icon: IconName;
  readonly breadcrumbs: readonly Breadcrumb[];
}

export const administrationNavigation: readonly NavigationItem[] = [
  { label: 'Admin Dashboard', path: '/administration', icon: 'LayoutDashboard' },
  { label: 'Roles & Permissions', path: '/administration/roles', icon: 'Users' },
  { label: 'System Configuration', path: '/administration/system', icon: 'SlidersHorizontal' },
  { label: 'Notification Settings', path: '/administration/notifications', icon: 'Bell' },
  { label: 'Audit Configuration', path: '/administration/audit', icon: 'FileSearch' },
  { label: 'Schedulers & Jobs', path: '/administration/jobs', icon: 'CalendarDays' },
  { label: 'Master Data', path: '/administration/master-data', icon: 'Layers' },
  { label: 'Email Configuration', path: '/administration/email', icon: 'Inbox' },
  { label: 'System Health', path: '/administration/health', icon: 'Activity' },
  ...(!environment.production ? [{ label: 'UI Patterns', path: '/ui-patterns', icon: 'Layers' as const }] : []),
];

// UI-246 module order; child labels are supported by Phase 1A's screen catalogue.
export const navigationGroups: readonly NavigationGroup[] = [
  { id: 'identity', label: 'Identity Management', icon: 'Users', items: [
    { label: 'Identities', path: '/identity', icon: 'Users' },
    { label: 'Lifecycle Events', path: '/identity/lifecycle', icon: 'Activity' },
  ] },
  { id: 'applications', label: 'Application Management', icon: 'Layers', items: [
    { label: 'Applications', path: '/applications', icon: 'Layers' },
    { label: 'Application Onboarding', path: '/applications/onboarding', icon: 'Plus' },
  ] },
  { id: 'accounts', label: 'Account Management', icon: 'UserRound', items: [
    { label: 'Accounts', path: '/accounts', icon: 'Users' },
    { label: 'Service Accounts', path: '/accounts/service', icon: 'Settings' },
  ] },
  { id: 'entitlements', label: 'Entitlement Management', icon: 'Network', items: [
    { label: 'Entitlement Catalog', path: '/entitlements', icon: 'Layers' },
    { label: 'Entitlement Hierarchy', path: '/entitlements/hierarchy', icon: 'Network' },
  ] },
  { id: 'requests', label: 'Access Requests', icon: 'FileSearch', items: [
    { label: 'My Access', path: '/my-access', icon: 'KeyRound' },
    { label: 'My Requests', path: '/requests', icon: 'FileSearch' },
    { label: 'Request Access', path: '/requests/new', icon: 'Plus' },
  ] },
  { id: 'approvals', label: 'Approval Management', icon: 'ClipboardCheck', items: [
    { label: 'My Approvals', path: '/approvals', icon: 'ClipboardCheck' },
    { label: 'Team Approvals', path: '/approvals/team', icon: 'Users' },
  ] },
  { id: 'workflows', label: 'Workflow Management', icon: 'Workflow', items: [
    { label: 'Workflow Definitions', path: '/workflows', icon: 'Workflow' },
    { label: 'Workflow Instances', path: '/workflows/instances', icon: 'Activity' },
  ] },
  { id: 'provisioning', label: 'Provisioning Management', icon: 'Settings', items: [
    { label: 'Provisioning Policies', path: '/provisioning/policies', icon: 'Settings' },
    { label: 'Provisioning Operations', path: '/provisioning', icon: 'Settings' },
    { label: 'Provisioning Jobs', path: '/provisioning/jobs', icon: 'CalendarDays' },
  ] },
  { id: 'policies', label: 'Policy & Governance', icon: 'Shield', items: [
    { label: 'Governance Dashboard', path: '/policies', icon: 'Shield' },
    { label: 'Policy Violations', path: '/policies/violations', icon: 'CircleAlert' },
  ] },
  { id: 'delegation', label: 'Delegation Management', icon: 'Users', items: [
    { label: 'Delegations', path: '/delegation', icon: 'Users' },
    { label: 'Delegated Approvals', path: '/delegation/approvals', icon: 'ClipboardCheck' },
  ] },
  { id: 'connectors', label: 'Connector & Discovery', icon: 'Network', items: [
    { label: 'Connectors', path: '/connectors', icon: 'Network' },
    { label: 'Discovery Jobs', path: '/connectors/discovery', icon: 'Search' },
  ] },
  { id: 'administration', label: 'Administration', icon: 'Settings', items: administrationNavigation },
  { id: 'reporting', label: 'Audit & Reporting', icon: 'FileSearch', items: [
    { label: 'Audit Dashboard', path: '/reporting', icon: 'LayoutDashboard' },
    { label: 'Audit Logs', path: '/reporting/logs', icon: 'FileSearch' },
  ] },
];
