//@flow
import * as userApi from '../user/user.js';
import * as groupApi from '../group/group.js';
import { PrivilegeType } from '../xcap/api.js';

export const CMS_COMPONENT_CLASS = 'se.josh.xcap.cms.CmsManager';

// FIXME: duplicated in xcap/api.js
export const Privileges = {
	VISITOR: 1,
	IDENTIFIED: 2,
	VERIFIED: 4,
	BLOCKED: 8,
	TRUSTED: 16,
	ADMIN: 32,
	SUPER_ADMIN: 64
};

export type Privilege =
	| 'VISITOR'
	| 'IDENTIFIED'
	| 'VERIFIED'
	| 'BLOCKED'
	| 'TRUSTED'
	| 'ADMIN'
	| 'SUPER_ADMIN';

export type Auth = {
	userPrivilege: Privilege,
	comment: boolean,
	create: boolean,
	moderate: boolean,
	read: boolean,
	postModerateRequired: boolean,
	textFilteredPre: boolean,
	textFilteringRequired: boolean,
	ruleId: number
};

export function isSuperUser({ user }: { user?: userApi.User }) {
	return userApi.hasElevatedPrivilege(
		{ user },
		'groups',
		groupApi.COMPONENT_CLASS,
		PrivilegeType.TRUSTED
	);
}

export function isAdminUser({ user }: { user?: userApi.User }) {
	return userApi.hasElevatedPrivilege({ user }, 'cms', CMS_COMPONENT_CLASS, PrivilegeType.TRUSTED);
}
