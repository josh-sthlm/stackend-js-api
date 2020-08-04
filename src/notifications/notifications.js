//@flow

import { getJson, type XcapJsonResult } from '../api.js';
import type { Thunk } from '../store.js';

/**
 * A notification
 */
export type Notification = {
	id: number,
	createdDate: number,
	modifiedDate: number,
	senderUserRef: string,
	source?: {
		communityContext: string,
		type: string,
		id: number
	},
	sourceRef?: string,
	status: 0,
	target?: {
		communityContext: string,
		type: string,
		id: number
	},
	targetRef?: string,

	/** NotificationType */
	type: string,
	userRef: string
};

export const NotificationType = {
	/**
	 * Comment on your entry (ntf to comments reference creator)
	 */
	COMMENT: 'COMMENT',

	/**
	 * Comment reply on your comment (ntf to parent comments reference creator)
	 */
	COMMENT_REPLY: 'COMMENT_REPLY',

	/**
	 * Comment on thread you also commented on (ntf to comment threads all comments creators)
	 */
	COMMENT_THREAD_WRITERS: 'COMMENT_THREAD_WRITERS',

	/**
	 * Forum entry on a thread you created (ntf to entrys threads creator)
	 */
	FORUM_ENTRY: 'FORUM_ENTRY',

	/**
	 * Forum entry on a thread you also wrote an entry on (ntf to threads all writers)
	 */
	FORUM_THREAD_WRITERS: 'FORUM_THREAD_WRITERS',

	/**
	 * Question you answered marked as solved, you're answer marked as the right one
	 */
	SOLVED: 'SOLVED',

	/**
	 * Question you answered marked as solved, another answer marked as the right one
	 */
	SOLVED_ANSWER_WRITERS: 'SOLVED_ANSWER_WRITERS',

	/**
	 * Question you wrote solved by a moderator
	 */
	SOLVED_BY_MODERATOR: 'SOLVED_BY_MODERATOR',

	/**
	 * Question has answers but not yet solved after X days notification to question creator.
	 */
	SOLVE_REQUEST_FIRST: 'SOLVE_REQUEST_FIRST',

	/**
	 * Question has answers but not yet solved after Y days notification to question creator.
	 */
	SOLVE_REQUEST_SECOND: 'SOLVE_REQUEST_SECOND',

	/**
	 * Question you wrote is marked as a duplicate
	 */
	DUPLICATE: 'DUPLICATE',

	/**
	 * Question you answered is marked as a duplicate
	 */
	DUPLICATE_ANSWER_WRITERS: 'DUPLICATE_ANSWER_WRITERS',

	/**
	 * Duplicated question you wrote, got an answer on active (duplicated) question
	 */
	QUESTION_ANSWERED_TO_DUPLICATES_CREATOR: 'QUESTION_ANSWERED_TO_DUPLICATES_CREATOR',

	/**
	 * Duplicated question you answered, got an answer on active (duplicated) question
	 */
	QUESTION_ANSWERED_TO_DUPLICATES_ANSWER_WRITERS: 'QUESTION_ANSWERED_TO_DUPLICATES_ANSWER_WRITERS',

	/**
	 * Duplicated question you wrote, the active (duplicated) question solved
	 */
	QUESTION_SOLVED_TO_DUPLICATES_CREATOR: 'QUESTION_SOLVED_TO_DUPLICATES_CREATOR',

	/**
	 * Duplicated question you answered, the active (duplicated) question solved
	 */
	QUESTION_SOLVED_TO_DUPLICATES_ANSWER_WRITERS: 'QUESTION_SOLVED_TO_DUPLICATES_ANSWER_WRITERS',

	/**
	 * Notification about an upcoming event
	 */
	UPCOMING_EVENT: 'UPCOMING_EVENT',

	/**
	 * Blog entry in a group you are a member of
	 */
	BLOG_ENTRY_IN_GROUP: 'BLOG_ENTRY_IN_GROUP',

	/**
	 * Someone applied to a group you are admin of
	 */
	GROUP_MEMBER_APPLICATION: 'GROUP_MEMBER_APPLICATION',

	/**
	 * A user has been added to a group
	 */
	GROUP_MEMBER_ADDED: 'GROUP_MEMBER_ADDED',

	/**
	 * An editor has been added to a group
	 */
	GROUP_EDITOR_ADDED: 'GROUP_EDITOR_ADDED',

	/**
	 * An admin has been added to a group
	 */
	GROUP_ADMIN_ADDED: 'GROUP_ADMIN_ADDED',

	/**
	 * A user has been removed from a group
	 */
	GROUP_MEMBER_REMOVED: 'GROUP_MEMBER_REMOVED',

	/**
	 * A user made thumbs up on your post (vote)
	 */
	THUMBS_UP: 'THUMBS_UP',

	/**
	 * A user made thumbs down on your post (vote)
	 */
	THUMBS_DOWN: 'THUMBS_DOWN',

	/**
	 * A user likes your object
	 */
	LIKE: 'LIKE'
};

export type ListNotificationsResult = XcapJsonResult & {
	pageSize: number,
	p: number,
	/** Maps from notification id to number of notifications of this type */
	senderCounts: Map<string, number>,
	notifications: Array<Notification>
};

/**
 * List notifications
 * @returns {Promise}
 */
export function listNotifications({
	page,
	pageSize
}: {
	page?: number,
	pageSize?: number
}): Thunk<ListNotificationsResult> {
	return getJson({
		url: '/notification/list',
		parameters: {
			page,
			pageSize,
			r: Math.random()
		}
	});
}

export type MarkAsReadResult = XcapJsonResult & {
	id: number
};

/**
 * Mark a notification as read
 * @returns {Promise}
 */
export function markAsRead({ id }: { id: number }): Thunk<MarkAsReadResult> {
	return getJson({ url: '/notification/mark-as-read', parameters: arguments });
}
