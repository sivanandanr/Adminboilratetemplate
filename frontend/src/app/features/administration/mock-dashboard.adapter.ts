import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { DashboardScenario, DashboardSnapshot } from './dashboard.models';

/** Isolated read-only fixtures. Replace this adapter with an API provider later. */
export const mockDashboard: DashboardSnapshot = {
  metrics: [
    { label: 'Total Users', value: '142', detail: '↑ +6 (Last 7 days)', icon: 'Users', tone: 'primary' },
    { label: 'Roles', value: '28', detail: '↑ +2', icon: 'Layers', tone: 'primary' },
    { label: 'Permissions', value: '416', detail: '↑ +18', icon: 'Shield', tone: 'warning' },
    { label: 'System Configurations', value: '12', detail: '↔ No change', icon: 'Settings', tone: 'primary' },
    { label: 'Active Notifications', value: '8', detail: '↑ +3', icon: 'Bell', tone: 'danger' },
    { label: 'Scheduled Jobs', value: '24', detail: '14 running · 10 idle', icon: 'CalendarDays', tone: 'primary' },
  ],
  roles: [
    { name: 'Super Administrator', category: 'System', description: 'Full system access with all administrative privileges', users: 5, permissions: 416 },
    { name: 'Administrator', category: 'System', description: 'Manage platform configuration, users, roles and applications', users: 18, permissions: 286 },
    { name: 'Application Owner', category: 'Business', description: 'Owner of applications and associated access entitlements', users: 32, permissions: 94 },
    { name: 'Entitlement Owner', category: 'Business', description: 'Manage entitlements, approvals and access policies', users: 19, permissions: 76 },
    { name: 'Approver', category: 'Operational', description: 'Approve or reject access requests and provisioning tasks', users: 67, permissions: 58 },
    { name: 'User Administrator', category: 'Operational', description: 'Manage user accounts and lifecycle operations', users: 12, permissions: 44 },
  ],
  activity: [
    { id: 'role', text: 'Role “Data Steward” created', detail: 'Demo Administrator · 10 Nov 2026, 10:24', icon: 'Users' },
    { id: 'system', text: 'System configuration updated', detail: 'Email settings modified · 10 Nov 2026, 09:58', icon: 'Settings' },
    { id: 'assignment', text: 'User assigned to role “Approver”', detail: 'Demo Administrator · 09 Nov 2026, 17:42', icon: 'UserRound' },
    { id: 'job', text: 'Scheduler job updated', detail: 'User Dormancy Check · 09 Nov 2026, 16:10', icon: 'CalendarDays' },
    { id: 'audit', text: 'Audit retention policy changed', detail: 'From 180 days to 365 days · 09 Nov 2026, 11:37', icon: 'FileSearch' },
  ],
  services: [
    { name: 'IAM Services', status: 'Running' },
    { name: 'Database', status: 'Healthy' },
    { name: 'Message Queue', status: 'Connected' },
    { name: 'Redis Cache', status: 'Connected' },
    { name: 'Scheduler Service', status: 'Running' },
  ],
};

@Injectable()
export class MockDashboardAdapter {
  load(scenario: DashboardScenario): Observable<DashboardSnapshot | null> {
    return timer(400).pipe(map(() => {
      if (scenario === 'error') throw new Error('Simulated dashboard failure');
      return scenario === 'empty' ? null : mockDashboard;
    }));
  }
}
