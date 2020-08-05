//@flow
import { getJson, post, createCommunityUrl, SortOrder, type XcapJsonResult, PrivilegeType } from '../api.ts';
import * as userApi from '../user/user.ts';
import type { Thunk } from '../store.ts';
import { type Request } from '../request.ts';
import type { PaginatedCollection } from '../PaginatedCollection.ts';
import type { Auth } from '../privileges.ts';
import type { Blog } from '../blog/blog.js';

/**
 * Xcap group api constants and methods.
 * @author jens
 * @since 3 apr 2017
 */

export type GroupType = 'OPEN' | 'CLOSED' | 'BLOG' | 'DISCUSSION';
export type GroupTypes = 'blog' | 'groups' | 'discussion';
export const groupType = {
	OPEN: 'OPEN',
	CLOSED: 'CLOSED',
	BLOG: 'BLOG',
	DISCUSSION: 'DISCUSSION'
};

export const GROUP_TYPES_BY_ID = {
	'1': 'CLOSED',
	'2': 'OPEN',
	'3': 'DISCUSSION',
	'4': 'BLOG'
};

export const Visibility = {
	VISIBLE: 1,
	HIDDEN: 2
};

export type VisibilityType = Visibility.VISIBLE | Visibility.HIDDEN;

/**
 * Group definition
 */
export type Group = {
	id: number,
	name: string, // Name of group
	description: string, //Description of group
	permalink: string, //url-path to group
	creatorUserId: number,
	creatorUserRef: any,
	createdDate: number,
	modifiedDate: number,
	categoryId: number,
	categoryRef: any,
	modStatus: string,
	ttl: number,
	obfuscatedReference: string,
	contentVisibility: string,
	nrOfMembers: number,
	type: GroupType, //OPEN or CLOSED group
	visibility: 'VISIBLE' | 'HIDDEN', // VISIBLE or HIDDEN
	blogKey: string, //url-path to group
	backgroundImage: string, //Main image of group
	css: {
		headerFont: string,
		magazineColorDarker: string,
		textFont: string,
		magazineColor: string,
		magazineColorLighter: string,
		textColor: string
	},
	darkLogotype: string,
	darkOrLightLogotype: string,
	featured: boolean,
	openForApplications: boolean,
	numberOfReaders: number,
	rating: number,
	calendarId: number,
	lightLogotype: string,
	tags: [string],
	totalNumberOfViews: number,
	adminIds: [number],
	adminsRef: Array<userApi.User>
};

export type GroupMember = {
	groupId: number,
	groupRef: Group,
	userId: number,
	userRef: userApi.User,

	/** Privilege. See privileges.ts */
	privilegeType: number,
	createdDate: number
};

/**
 * Membership request
 */
export type GroupMembershipRequest = {
	createdDate: number,
	groupId: number,
	userId: number,
	text: string
};

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS = 'net.josh.community.group.GroupManager';

/**
 * Component name
 * @type {string}
 */
export const COMPONENT_NAME = 'group';

type SortBy = 'SIZE' | 'ALPHABETICAL' | 'LAST_ACTIVITY_DATE' | 'CREATION_DATE';
/**
 * Sort by for groups
 */
export const sortBy = {
	/**
	 * Sort by number of members
	 */
	SIZE: 1,

	/**
	 * Sort alphabetically
	 */
	ALPHABETICAL: 2,

	/**
	 * Sort by last activity date
	 */
	LAST_ACTIVITY_DATE: 3,

	/**
	 * Sort by creation date.
	 */
	CREATION_DATE: 4
};

export type GroupMemberSortOrder = 'JOIN_DATE_ASC' | 'JOIN_DATE_DESC';
/**
 * Sort order used when listing group members
 */
export const groupMemberSortOrder = {
	JOIN_DATE_ASC: 'JOIN_DATE_ASC',
	JOIN_DATE_DESC: 'JOIN_DATE_DESC'
};

/**
 * Membership actions
 */
export const MemberShipRequestType = {
	/**
	 * Add a member or approve a pending membership application (available to group admin only)
	 */
	ADD: 'ADD',

	/**
	 * Remove a member or pending membership application (available to group admin only)
	 */
	REMOVE: 'REMOVE',

	/**
	 * Apply for membership.
	 */
	APPLY: 'APPLY',

	//INVITE : "INVITE",

	/**
	 * Toggle admin status (available to group admin only)
	 */
	TOGGLE_ADMIN: 'TOGGLE_ADMIN'
};

export function getUrl({ request }: { request: Request }): string {
	return createCommunityUrl({
		request,
		path: '/groups'
	});
}

export function getBlogUrl({ request }: { request: Request }): string {
	return createCommunityUrl({
		request,
		path: '/blog'
	});
}

/**
 *
 * Should be fixed so it doesn't only work for king
 */
export function getBlogPostUrl({
	request,
	blogPermalink,
	entryPermalink
}: {
	request: Request,
	blogPermalink?: string,
	entryPermalink?: string
}): string {
	let u = '/blog/' + (!!blogPermalink ? blogPermalink : 'king');

	if (!!entryPermalink) {
		return createCommunityUrl({
			request,
			path: u + '/' + entryPermalink
		});
	}

	return createCommunityUrl({
		request,
		path: u + '/posts'
	});
}

/**
 * Get the site link to a group
 * @param request
 * @param group
 * @returns {string}
 */
export function getGroupUrl({ request, group }: { request: Request, group: Group }): string {
	return createCommunityUrl({
		request,
		path: '/' + group.permalink
	});
}

export function getGroupSettingsUrl({
	request,
	group
}: {
	request: Request,
	group: Group
}): string {
	return createCommunityUrl({
		request,
		path: '/' + group.permalink + '/settings'
	});
}

export type GroupMemberAuth = {
	groupId: number,
	groupRef: string,
	userId: number,
	userRef: string,
	privilegeType: number,
	createdDate: number
};

/**
 * Get CSS for a group.
 * Specify groupId or groupPermalink.
 * @param groupPermalink
 * @param groupId
 * @return {Promise}
 */
export function getCss({ groupPermalink, groupId }: { groupPermalink?: string, groupId?: number }) {
	throw 'not implemented';
	// FIXME: Returns text/css
	//return xcapApi.getJson('/group/css', arguments);
}

/**
 * Given an url, get the group type ("blog", "group", "discussion")
 * @param request
 * @param url
 * @returns {string}
 */
export function getGroupType({ request, url }: { request: Request, url: string }): string {
	try {
		const groupsRegExp = new RegExp(`${request.communityUrl}\/([^\/]*)`);
		let r = url.match(groupsRegExp);
		if (r) {
			return r[1];
		}
	} catch (e) {
		// Ignored
	}

	console.error("Couldn't getGroupType: ", url);
	return '';
}

export type ListMyGroupsResult = XcapJsonResult & {
	groups: PaginatedCollection<Group>,

	/** Maps from group id */
	groupAuth: Map<string, Auth>,

	groupTypes: Map<string, number>
};

/**
 * List my groups
 */
export function listMyGroups(): Thunk<ListMyGroupsResult> {
	return getJson({ url: '/group/list/my' });
}

/**
 * List groups.
 *
 * @param q {string} Search expression. Optional.
 * @param categoryId {number} Category id. Optional
 * @param categoryPermaLink {string} Category permalink. Optional.
 * @param memberUserId {number} Search for groups where this user is a member. Optional
 * @param sortBy {sortBy} Sort by
 * @param order {SortOrder} order
 * @param pageSize {number} Page size
 * @param p {number} Page number
 * @return {Promise}
 */
export function search({
	q,
	categoryId,
	categoryPermaLink,
	memberUserId,
	sortBy = sortBy.ALPHABETICAL,
	order = SortOrder.ASCENDING,
	pageSize,
	p = 1
}: {
	q?: string, //Search expression.
	categoryId?: number,
	categoryPermaLink?: string,
	memberUserId?: number, //Search for groups where this user is a member.
	sortBy?: number, //Se SortBy
	order?: GroupMemberSortOrder,
	pageSize?: number,
	p?: number //page number
}): Thunk<*> {
	return getJson({ url: '/group/search', parameters: arguments });
}

/**
 * List groups by tag.
 *
 * @param tag {string} Tag.
 * @param pageSize {number} Page size
 * @param p {number} Page number
 */
export function listGroupsByTag({
	tag,
	pageSize,
	p = 1
}: {
	tag: string,
	pageSize?: number,
	p?: number
}): Thunk<*> {
	return getJson({ url: '/group/list/by-tag', parameters: arguments });
}

/**
 * Get a group and it's members.
 * Specify groupId or groupPermalink.
 */
export function getGroup({
	groupPermalink,
	groupId
}: { groupPermalink: string } | { groupId: number }): Thunk<*> {
	return getJson({ url: '/group/get', parameters: arguments });
}

export type SubscribeResult = XcapJsonResult & {
	group: ?Group,
	groupId: number,
	groupPermalink: string,
	groupUserPrivilege: number
};

/**
 * Subscribe to a group
 * @param groupPermalink
 * @param groupId
 */
export function subscribe({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<SubscribeResult> {
	return post({ url: '/group/subscribe', parameters: arguments });
}

/**
 * Unsubscribe from a group
 * @param groupPermalink
 * @param groupId
 * @returns {function(Dispatch)}
 */
export function unsubscribe({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<*> {
	return post({ url: '/group/unsubscribe', parameters: arguments });
}

/**
 * Apply for membership in a group
 * @param groupPermalink
 * @param groupId
 */
export function applyForMembership({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<*> {
	return post({ url: '/group/applyForMembership', parameters: arguments });
}

/**
 * Edit a group membership, membership request
 *
 * Specify groupId or groupPermalink.
 *
 * @param action {MemberShipRequestType} Required
 * @param groupPermalink
 * @param groupId
 * @param userId {[number]} One or more user ids. Required
 * @param privilegeType {PrivilegeType} Optional. The privilege of the user (can be used to add and make a user admin in one request)
 */
export function editMembership({
	action,
	groupPermalink,
	groupId,
	userId,
	privilegeType
}: {
	action: string,
	groupPermalink?: string,
	groupId?: number,
	userId: number,
	privilegeType: number
}): Thunk<*> {
	return post({
		url: '/group/edit-membership',
		parameters: {
			groupPermalink,
			groupId,
			userId,
			memberShipRequestType: action,
			privilegeType,
			ignoreDuplicates: true
		}
	});
}

/**
 * List pending group membership requests.
 * Available to group admins only.
 *
 * @param groupPermalink
 * @param groupId
 */
export function listMembershipRequests({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<*> {
	return getJson({ url: 'group/list/membership-requests', parameters: arguments });
}

export type ListMembersResult = XcapJsonResult & {
	group: ?Group,
	groupId: number,
	groupPermalink: ?string,
	groupMembers: Array<GroupMember>
};

/**
 * List members of a group
 *
 * Specify groupId or groupPermalink.
 * FIXME: No support for pagination
 */
export function listMembers({
	groupPermalink,
	groupId,
	groupMemberPrivilegeType,
	sortOrder = groupMemberSortOrder.JOIN_DATE_DESC
}: {
	groupPermalink?: string, // ex: blog/king
	groupId?: number,
	sortOrder?: GroupMemberSortOrder,
	groupMemberPrivilegeType?: string //Comma separated string of PrivilegeTypes, for example "16,32"
}): Thunk<ListMembersResult> {
	return getJson({ url: '/group/list/members', parameters: arguments });
}

/**
 * Edit or create a group.
 *
 * Action will set all parameters, not just the supplied one.
 *
 * @param groupId 			Group id (Optional)
 * @param groupPermalink	Group permalink (Optional)
 * @param name				Name, required.
 * @param headline
 * @param description
 * @param visibility
 * @param contentVisibility
 * @param isOpenForApplications
 * @param categoryId		Category id (Optional)
 * @param tags				Tags (Optional)
 * @returns {Thunk<XcapJsonResult>}
 */
export function editGroup({
	groupId,
	groupPermalink,
	name,
	headline,
	description,
	visibility,
	contentVisibility,
	isOpenForApplications,
	categoryId,
	tags
}: {
	groupId?: number,
	groupPermalink?: string,
	name: string,
	headline?: string,
	description?: string,
	visibility: VisibilityType,
	contentVisibility: VisibilityType,
	isOpenForApplications: boolean,
	categoryId?: number,
	tags?: Array<string>
}): Thunk<XcapJsonResult> {
	return post({
		url: '/group/edit',
		parameters: arguments
	});
}

export type CheckGroupPermalinkResult = XcapJsonResult & {
	groupPermalink: string,
	valid: boolean,
	available: boolean
};

/**
 * Check if a group permalink is valid and available.
 * @param groupPermalink
 */
export function checkGroupPermalink({
	groupPermalink
}: {
	groupPermalink: string
}): Thunk<CheckGroupPermalinkResult> {
	return getJson({
		url: '/group/check-permalink',
		parameters: arguments
	});
}

/**
 * Set the group logotype image.
 *
 * @param groupId
 * @param imageId
 */
export function setGroupLogotypeImage({
	groupId,
	imageId
}: {
	groupId: number,
	imageId: number
}): Thunk<XcapJsonResult> {
	return post({
		url: '/group/set-image',
		parameters: {
			groupId,
			imageId,
			type: 'LOGOTYPE'
		}
	});
}

/**
 * Set the group background image.
 *
 * @param groupId
 * @param imageId
 */
export function setGroupBackgroundImage({
	groupId,
	imageId
}: {
	groupId: number,
	imageId: number
}): Thunk<XcapJsonResult> {
	return post({
		url: '/group/set-image',
		parameters: {
			groupId,
			imageId,
			type: 'BACKGROUND'
		}
	});
}

/**
 * Set group styling.
 *
 * Application specific colors and fonts can be set by
 * supplying extra parameters named *color* or *font*.
 *
 * Requires group admin.
 *
 * @param groupId				Group id
 * @param permalink				Group permalink (optional)
 * @param lightLogotypeId		Image id of light logotype image
 * @param darkLogotypeId		Image id of dark logotype image
 * @param backgroundImageId		Image id of background image
 * @param backgroundCropX		Background crop position
 * @param backgroundCropY		Background crop position
 */
export function setGroupStyle({
	groupId,
	permalink,
	lightLogotypeId,
	darkLogotypeId,
	backgroundImageId,
	backgroundCropX,
	backgroundCropY,
	...any
}: {
	groupId?: number,
	permalink?: string,
	lightLogotypeId?: number,
	darkLogotypeId?: number,
	backgroundImageId?: number,
	backgroundCropX?: number,
	backgroundCropY?: number
}): Thunk<XcapJsonResult> {
	return post({
		url: '/group/set-style',
		parameters: arguments
	});
}

/**
 * Remove a group.
 *
 * @param groupId	Group id
 */
export function removeGroup({ groupId }: { groupId: number }): Thunk<XcapJsonResult> {
	return post({
		url: '/group/remove',
		parameters: arguments
	});
}

export function getGAGroupData({ blog }: { blog: Blog }) {
	let groupName, groupType, groupTypeEnum;
	try {
		const gl = blog.groupRef.permalink;
		groupType = `${gl.substring(0, gl.lastIndexOf('/'))}`;
		groupName = `${gl.substring(gl.lastIndexOf('/') + 1)}`;
		groupTypeEnum = blog.groupRef.type;
	} catch (e) {
		groupName = 'unknown';
		groupType = 'unknown';
		groupTypeEnum = 'unknown';
		console.error('Error setting groupName and groupType in analytics', e);
	}
	return { groupName, groupType, groupTypeEnum };
}
