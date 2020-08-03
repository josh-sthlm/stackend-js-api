//@flow
import {
	getJson,
	post,
	createCommunityUrl,
	type XcapJsonResult,
	type AuthObject
} from '../xcap/api.js';
import * as event from '../event/event.js';
import * as poll from '../poll/poll.js';
import * as group from '../group/group.js';
import * as gaFunctions from '../functions/gaFunctions.js';
import { type Thunk } from '../types/store.js';
import { type Request } from '../request.js';
import { type Category } from '../category/category.js';
import { type VoteSummary } from '../vote/vote.js';
import { type Image } from '../media/media.js';
import { type Auth } from '../privileges/privileges.js';
import { type PaginatedCollection } from '../xcap/PaginatedCollection.js';
import { type LikeDataMap } from '../like/like.js';

/**
 * Xcap Blog api constants and methods.
 * @author jens
 * @since 6 feb 2017
 */

/**
 * The default blog key
 * @type {string}
 */
export const DEFAULT_BLOG_KEY: string = 'king';

/**
 * Default context for the blog
 * @type {string}
 */
export const DEFAULT_CONTEXT: string = 'news';

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS: string = 'net.josh.community.blog.BlogManager';

/**
 * Component name
 * @type {string}
 */
export const COMPONENT_NAME: string = 'blog';

/**
 * Blog entry class name
 */
export const BLOG_ENTRY_CLASS: string = 'net.josh.community.blog.BlogEntry';

/**
 * Statuses of a blog entry
 */
export const BlogEntryStatus = {
	PUBLISHED: 'PUBLISHED',
	DRAFT: 'DRAFT',
	DELETED: 'DELETED'
};

export type BlogEntryStatusType = $Values<BlogEntryStatus>;

export const displayType = {
	FeedEntry: 'feedEntry',
	BlogEntry: 'blogEntry',
	BLOG_ENTRY_PORTFOLIO: 'BLOG_ENTRY_PORTFOLIO',
	TopList: 'toplist',
	FeedEntryTopList: 'FeedEntryTopList',
	BlogEntryTopList: 'BlogEntryTopList',
	//SearchListing: 'searchListing',
	EntrySearchResult: 'entrySearchResult'
};

export type FeedType = 'groups' | 'blog' | 'discussion';

export type DisplayType =
	| displayType.FeedEntry
	| displayType.BlogEntry
	| displayType.BLOG_ENTRY_PORTFOLIO
	//	| displayType.SearchListing
	| displayType.EntrySearchResult;

/**
 * Blog entry definition
 */
type SlideId = number; //Id of slide image
type SlideUrl = string; //url to image of slide
type Slide = SlideId | SlideUrl;
export type Slideshow = {
	frame: boolean,
	shadow: boolean,
	hasImageSlide: boolean,
	hasVideoSlide: boolean,
	empty: boolean,
	slides: Array<{ slide: Slide }>
};

export type BlogEntry = {
	__type: 'net.josh.community.blog.BlogEntry',
	id: number,
	name: string,
	description: string,
	permalink: string,
	creatorUserId: number,
	creatorUserRef: any,
	createdDate: number,
	publishDate: number,
	modifiedDate: number,
	modStatus: string,
	ttl: number,
	obfuscatedReference: string,
	blogId: number,
	blogRef: Blog,
	type: string,
	body: string,
	plainTextBody: string,
	categoryRef: Array<any>,
	slideshow?: Slideshow,
	eventRef?: event.Event,
	pollRef?: poll.Poll,
	numberOfComments: number,
	numberOfLikes: number
};

export type BlogEntries = {
	__relatedObjects: any,
	blogId: number,
	blogKey: string,
	likesByCurrentUser: any,
	resultPaginated: {
		entries: Array<BlogEntry>
	},
	userRsvpStatuses: any
};

/**
 * Blog definition
 */
export type Blog = {
	id: number,
	name: string,
	description: string,
	creatorUserRef: any,
	createdDate: number,
	modifiedDate: number,
	categoryRef: any,
	referenceId: number,
	modStatus: any,
	ttl: number,
	obfuscatedReference: string,
	css: number,
	cssName: string,
	entrySize: number,
	groupRef: group.Group /** Owning group */,
	publishedEntrySize: number,
	subtype: number,
	type: number
};

/**
 * Blog with auth information
 */
export type AuthBlog = Blog & {
	auth: Auth
};

/**
 * Get the first image of the slideshow
 * @param blogEntry
 * @returns {*}
 */
export function getFirstSlideshowImageUrl(slideshow: ?Slideshow): ?string {
	if (typeof slideshow === undefined || slideshow === null || !slideshow.hasImageSlide) {
		return null;
	}

	// FIXME: May be video
	return slideshow.slides[0];
}

/**
 * returns the url to a specific Blog Entry
 */
export function getBlogEntryUrl({
	request,
	entry
}: {
	request: Request,
	entry: BlogEntry
}): string {
	try {
		const blogPermalink = entry.blogRef.groupRef
			? entry.blogRef.groupRef.permalink
			: entry.blogRef.permalink;

		return createCommunityUrl({
			request,
			path: '/' + blogPermalink + '/posts/' + entry.permalink
		});
	} catch (e) {
		console.error('could not find Entry url:', e, entry);
		return '';
	}
}

/**
 * Create a new blogEntry that is ok to save.
 * @returns {{id: number, title: string, description: string, body: string, publishDate: null, blogKey: string, allowComments: boolean, categories: Array, headerStyle: {font: null, fontSize: null, fontStyle: null, overlay: boolean, fg: {color: string, opacity: number}, bg: {color: string, opacity: number}, autoHeaderColor: null, autoStyle: boolean, paletteColors: Array}, slideshow: {frame: boolean, shadow: boolean, slides: Array}, tags: Array, products: Array}}
 */
export function newBlogEntry(blogKey: string) {
	//FIXME: a lot of hardcoded stuff, not sure what is necessary
	return {
		id: 0,
		title: '',
		description: '',
		body: '',
		publishDate: null,
		blogKey: blogKey,
		allowComments: true,
		categories: [],
		headerStyle: {
			font: null,
			fontSize: null,
			fontStyle: null,
			overlay: false,
			fg: { color: '#000000', opacity: 1 },
			bg: { color: '#EAEAEA', opacity: 0.9 },
			autoHeaderColor: null,
			autoStyle: false,
			paletteColors: []
		},
		slideshow: {
			frame: false,
			shadow: false,
			slides: []
		},
		tags: [],
		products: []
	};
}

export type BlogEntryListingResult = XcapJsonResult & {
	resultPaginated: PaginatedCollection<BlogEntry>
};

export type GetEntriesResult = BlogEntryListingResult & {
	likes: LikeDataMap,
	userRsvpStatuses: any,

	/** Maps from event id to status to list */
	rsvpUserIds: Map<string, Map<string, any>>,

	likesByCurrentUser: Map<string, any>,

	categories: Array<Category>,
	blog: ?Blog,
	authBlog: ?AuthObject
};

/**
 * List blog entries.
 *
 * @param q Search expression (optional)
 * @param blogKey List entries from a specific blog (optional, default: all)
 * @param blogId List entries from a specific blog (optional, default: all)
 * @param creatorUserId List entries by a specific user (optional, default all)
 * @param author List entries by a specific user alias (optional, default all)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @param categoryPermaLink (optional)
 * @param categoryId (optional)
 * @param goToBlogEntry Start the pagination at the entry permalink (optional)
 * @returns {Thunk}
 */
export function getEntries({
	q,
	blogKey,
	blogId,
	creatorUserId,
	author,
	p,
	pageSize,
	categoryPermaLink,
	categoryId,
	goToBlogEntry
}: {
	q?: string,
	blogKey?: string,
	blogId?: number,
	creatorUserId?: number,
	author?: string,
	p?: number,
	pageSize?: number,
	categoryPermaLink?: string,
	categoryId?: number,
	goToBlogEntry?: string
}): Thunk<GetEntriesResult> {
	return getJson({
		url: '/blog/entries/list',
		parameters: arguments
	});
}

/**
 * List blog entries that the current user has written.
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Thunk}
 */
export function getMyEntries({
	p,
	pageSize
}: {
	p?: number,
	pageSize?: number
}): Thunk<BlogEntryListingResult> {
	return getJson({ url: '/blog/entries/my', parameters: arguments });
}

/**
 * List the most popular blog entries.
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function getMostPopularEntries({
	p,
	pageSize
}: {
	p?: number,
	pageSize?: number
}): Thunk<BlogEntryListingResult> {
	return getJson({ url: '/blog/entries/most-popular', parameters: arguments });
}

// FIXME: Use same format as other listings
export type GetMostCommentedEntriesResult = XcapJsonResult & {
	mostCommentedPaginated: PaginatedCollection<BlogEntry>
};
/**
 * List the blog entries with most comments.
 *
 * Specify either daysBack or startDate and endDate.
 *
 * @param daysBack {Number} statistics interval (optional)
 * @param startDate {Date} statistics interval (optional)
 * @param endDate {Date} statistics interval (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function getMostCommentedEntries({
	daysBack = 0,
	startDate = null,
	endDate = null,
	p = 1,
	pageSize
}: {
	daysBack?: number,
	startDate?: any,
	endDate?: any,
	p?: number,
	pageSize?: number
}): Thunk<GetMostCommentedEntriesResult> {
	return getJson({ url: '/blog/entries/most-commented', parameters: arguments });
}

/**
 * List recommended blog entries.
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function getRecommendedEntries({
	p,
	pageSize
}: {
	p?: number,
	pageSize?: number
}): Thunk<BlogEntryListingResult> {
	return getJson({ url: '/blog/entries/recommended', parameters: arguments });
}

export type GetBlogEntryResult = XcapJsonResult & {
	likes: LikeDataMap,
	tags: Array<string>,
	categories: Array<Category>,
	voteSummary: VoteSummary,
	pinned: boolean,
	numberOfComments: number,
	blogKey: string,
	isEditAllowed: boolean,
	views: number,
	mainArticleImages: Array<Image>,
	blogEntry: ?BlogEntry
};

/**
 * Get a blog entry.
 *
 * @param id Blog entry id (required)
 * @param permalink
 * @returns {Promise}
 *
 */
export function getEntry({
	id,
	entryPermaLink,
	blogKey
}: {
	id?: number,
	entryPermaLink?: string,
	blogKey: string
}): Thunk<GetBlogEntryResult> {
	return getJson({ url: '/blog/entry/get', parameters: arguments });
}

export type SetEntryStatusResult = XcapJsonResult & {
	entry: BlogEntry,
	categories: Array<Category>,
	blog: Blog,
	authBlog: AuthBlog
};

export type SetEntryStatus = {
	blogKey: string,
	id: number,
	status: BlogEntryStatusType
};

/**
 * Set the status of the blog entry.
 *
 * @param id
 * @param blogKey
 * @param status
 * @returns {Promise}
 */
export function setEntryStatus({
	blogKey,
	id,
	status
}: SetEntryStatus): Thunk<SetEntryStatusResult> {
	return post({ url: '/blog/entry/set-status', parameters: arguments });
}

export type SaveEntryResult = XcapJsonResult & {
	permalink: ?string,
	blogKey: ?string,
	draftId: number,
	entry: ?BlogEntry
};

/**
 * Save a blog entry.
 * @param blogEntryJson
 * @param type
 * @param draftId
 * @param blogKey
 * @returns {Promise}
 */
export function saveEntry({
	blogEntryJson,
	type,
	draftId,
	blogKey
}: {
	blogEntryJson: any,
	type: any,
	draftId?: number,
	blogKey: string
}): Thunk<SaveEntryResult> {
	return post({
		url: '/blog/save-blog-entry',
		parameters: {
			blogEntryJson: JSON.stringify(blogEntryJson),
			draftId,
			type,
			blogKey
		}
	});
}

type GaTrackPost = {
	blogEntry: BlogEntry
};

export function gaPostEventObject({ blogEntry }: GaTrackPost) {
	return getEventObject('community_post', blogEntry);
}

export function gaEditPostEventObject({ blogEntry }: GaTrackPost) {
	return getEventObject('edit_community_post', blogEntry);
}

export function getEventObject(eventAction: any, blogEntry: any) {
	const { eventLabel, eventCategory } = getGALabels({ blogEntry });
	return {
		event_action: eventAction,
		event_label: eventLabel,
		event_category: eventCategory
	};
}

function getGALabels({ blogEntry }: GaTrackPost) {
	const objectType = `BlogEntry`;
	const { groupName, groupType, groupTypeEnum } = group.getGAGroupData({ blog: blogEntry.blogRef });
	const blogEntryName = !!blogEntry.permalink ? blogEntry.permalink : '';
	const readableCategory = gaFunctions.getGaObjectName({
		object: blogEntry.__type,
		relatedToObject: groupType
	});
	const eventCategory = `${readableCategory}_(${objectType}_${groupTypeEnum})`;
	const eventLabel = `${groupName}_${blogEntryName}_(${blogEntry.blogId}_${blogEntry.id})`;
	return { eventLabel, eventCategory };
}
