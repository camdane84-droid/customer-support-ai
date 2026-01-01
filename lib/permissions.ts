export type Role = 'owner' | 'admin' | 'agent' | 'viewer';

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  agent: 2,
  viewer: 1,
};

export const PERMISSIONS = {
  // Business management
  UPDATE_BUSINESS_SETTINGS: ['owner', 'admin'],
  DELETE_BUSINESS: ['owner'],
  MANAGE_BILLING: ['owner'],

  // Team management
  INVITE_MEMBERS: ['owner', 'admin'],
  REMOVE_MEMBERS: ['owner', 'admin'],
  UPDATE_MEMBER_ROLES: ['owner', 'admin'],

  // Conversations
  VIEW_CONVERSATIONS: ['owner', 'admin', 'agent', 'viewer'],
  CREATE_CONVERSATIONS: ['owner', 'admin', 'agent'],
  UPDATE_CONVERSATIONS: ['owner', 'admin', 'agent'],
  ARCHIVE_CONVERSATIONS: ['owner', 'admin', 'agent'],

  // Messages
  VIEW_MESSAGES: ['owner', 'admin', 'agent', 'viewer'],
  SEND_MESSAGES: ['owner', 'admin', 'agent'],

  // Settings
  MANAGE_SOCIAL_CONNECTIONS: ['owner', 'admin'],
  MANAGE_CANNED_RESPONSES: ['owner', 'admin'],
  MANAGE_KNOWLEDGE_BASE: ['owner', 'admin'],

  // Analytics
  VIEW_ANALYTICS: ['owner', 'admin', 'agent', 'viewer'],
} as const;

export function hasPermission(
  userRole: Role,
  permission: keyof typeof PERMISSIONS
): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly Role[];
  return allowedRoles.includes(userRole);
}

export function canManageRole(
  managerRole: Role,
  targetRole: Role
): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}
