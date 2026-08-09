export type Permission =
  | 'dashboard.read'
  | 'roster.read'
  | 'roster.manage'
  | 'discord_ids.manage'
  | 'cadets.read'
  | 'training.read'
  | 'training.manage'
  | 'fto_resources.read'
  | 'probationer_tests.read'
  | 'probationer_tests.manage'
  | 'documents.read'
  | 'documents.manage'
  | 'forms.read'
  | 'forms.manage'
  | 'admin.read'
  | 'admin.manage'
  | 'audit_logs.read';

export interface PermissionSubject {
  permissions: Permission[];
}

export function hasPermission(subject: PermissionSubject | null | undefined, permission: Permission) {
  return Boolean(subject?.permissions.includes(permission) || subject?.permissions.includes('admin.manage'));
}

export function hasAnyPermission(subject: PermissionSubject | null | undefined, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(subject, permission));
}
