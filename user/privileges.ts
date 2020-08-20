//@flow
import { User, hasElevatedPrivilege } from './index';
import * as groupApi from '../group';

export const CMS_COMPONENT_CLASS = 'se.josh.xcap.cms.CmsManager';

// FIXME: duplicated in xcap/index.ts

/**
 * Privilege types (new enum based version)
 */
export enum Privilege {
  VISITOR = 'VISITOR',
  IDENTIFIED = 'IDENTIFIED',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
  TRUSTED = 'TRUSTED',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum PrivilegeTypeId {
  VISITOR = 1,
  IDENTIFIED = 2,
  VERIFIED = 4,
  BLOCKED = 8,
  TRUSTED = 16,
  ADMIN = 32,
  SUPER_ADMIN = 64,
}

/**
 * Privilege types (old id based version)
 */
export const PRIVILEGE_TYPE_IDS = {
  [Privilege.VISITOR]: 1,
  [Privilege.IDENTIFIED]: 2,
  [Privilege.VERIFIED]: 4,
  [Privilege.BLOCKED]: 8,
  [Privilege.TRUSTED]: 16,
  [Privilege.ADMIN]: 32,
  [Privilege.SUPER_ADMIN]: 64,
};

export type PrivilegeTypeIds = 1 | 2 | 4 | 8 | 16 | 32 | 64;

/**
 * Privilege type names
 */
const PRIVILEGE_NAMES: { [id: string]: string } = {
  '1': 'Visitor',
  '2': 'Identified',
  '4': 'Verified',
  '8': 'Blocked',
  '16': 'Author',
  '32': 'Admin',
  '64': 'Super-Admin',
};

/**
 * Get the name of a privilege type
 */
export function getPrivilegeName(privilegeTypeId: number): string {
  const s = PRIVILEGE_NAMES[String(privilegeTypeId)];
  return s || 'Visitor';
}

/**
 * Describes the user access to an object
 */
export interface AuthObject {
  /** Users privilege */
  userPrivilege: Privilege;

  /** Is comment allowed? */
  comment: boolean;

  /** Is create allowed? */
  create: boolean;

  /** Is moderate allowed? */
  moderate: boolean;

  /** Is read allowed? */
  read: boolean;

  /** Is post moderation required? */
  postModerateRequired: boolean;

  /** Will objects caught by the text filter cause it to be pre-moderated? */
  textFilteredPre: boolean;

  /** Is text filtering required? */
  textFilteringRequired: boolean;

  /** Rule in effect */
  ruleId: number;
}

export function isSuperUser({ user }: { user: User | null }): boolean {
  return hasElevatedPrivilege(
    user,
    'groups',
    groupApi.COMPONENT_CLASS,
    PrivilegeTypeId.TRUSTED
  );
}

export function isAdminUser({ user }: { user: User | null }): boolean {
  return hasElevatedPrivilege(
    user,
    'cms',
    CMS_COMPONENT_CLASS,
    PrivilegeTypeId.TRUSTED
  );
}
