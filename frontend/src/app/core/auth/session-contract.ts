import { AuthProviderId, AuthSession, Permission, ProfileField, permissions } from './auth.models';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): string => { if (typeof value !== 'string' || value.length > 256) throw new Error('Invalid session contract'); return value; };
const strings = (value: unknown): string[] => { if (!Array.isArray(value) || value.length > 128) throw new Error('Invalid session contract'); return value.map(text); };

/** Reject malformed BFF responses; expose only application-known permissions/fields. */
export function parseSession(value: unknown): AuthSession {
  if (!record(value) || !record(value['user'])) throw new Error('Invalid session contract');
  const user = value['user'];
  const provider = text(user['provider']);
  if (!['local', 'entra', 'ad', 'mock'].includes(provider)) throw new Error('Invalid provider');
  const serverTime = value['serverTime']; const expiresAt = value['expiresAt'];
  if (typeof serverTime !== 'number' || !Number.isFinite(serverTime) || typeof expiresAt !== 'number' || !Number.isFinite(expiresAt) || expiresAt <= serverTime) throw new Error('Invalid expiry');
  const lastSignIn = user['lastSignIn'];
  if (lastSignIn !== null && (typeof lastSignIn !== 'number' || !Number.isFinite(lastSignIn))) throw new Error('Invalid last sign in');
  return { serverTime, expiresAt, user: {
    id: text(user['id']), displayName: text(user['displayName']), username: text(user['username']), employeeId: text(user['employeeId']), email: text(user['email']),
    department: text(user['department']), designation: text(user['designation']), manager: text(user['manager']), accountType: text(user['accountType']), provider: provider as AuthProviderId,
    roles: strings(user['roles']), permissions: strings(user['permissions']).filter((permission): permission is Permission => (permissions as readonly string[]).includes(permission)),
    editableFields: strings(user['editableFields']).filter((field): field is ProfileField => ['displayName', 'email', 'department', 'designation'].includes(field)), lastSignIn,
  } };
}
