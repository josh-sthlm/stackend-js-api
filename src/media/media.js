//@flow
import * as api from '../api.ts';
import * as Stackend from '../stackend/stackend.ts';
import { LoadJson } from '../LoadJson.ts';
import { type Thunk } from '../store.ts';
import type { PaginatedCollection } from '../PaginatedCollection.ts';
import type { User } from '../user/user.ts';
import type { XcapJsonResult, Reference } from '../api.ts';

/**
 * Image
 */
export const MediaStatus = {
	OK: 'OK',
	NOT_OK: 'NOT_OK',
	NOT_PROCESSED: 'NOT_PROCESSED',
	TEMPORARY: 'TEMPORARY'
};

export type MediaStatusType = $Values<typeof MediaStatus>;

export type Media = {
	id: number,
	createdDate: Date,
	originalName: string,
	referenceId: number,
	status: MediaStatusType,
	title: string,
	description: string,

	mediaType: MediaTypes,

	/** Mime type: image/jpg etc */
	mimeType: string,

	/** File size in bytes */
	bytes: number,

	/** File size as string 46.1KB */
	size: string,

	creatorUserId: number,

	creatorUserRef: ?User,

	modifiedDate: Date,

	/** Url to original media file */
	url: string
};

export type Image = Media & {
	width: number,
	height: number
};

export type Video = Media & {
	width: number,
	height: number,
	/* Disabled for now. Use url instead: finalVideoUrl: string,*/
	/** Length in seconds */
	length: number
};

export type Document = Media & {};

export type Audio = Media & {
	/** Length in seconds */
	length: number
};

/**
 * Image, Document, Video or Audio
 */
export type MediaObject = Image | Document | Video | Audio;

export type Thumbnail = {
	id: number,
	/** Media object id */
	mediaId: number,

	/** Url to the thumbnail file */
	url: string
};

/**
 * Image thumbnail
 */
export type ImageThumbnail = Thumbnail & {
	/** Actual thumbnail width (as opposed to requested width in the ThubnailConfig) */
	width: number,

	/** Actual thumbnail height (as opposed to requested width in the ThubnailConfig) */
	height: number,

	/** Size in bytes*/
	bytes: number,

	/**
	 * Media type id
	 */
	mediaType: MediaTypeId,

	/**
	 * Created date
	 */
	createdDate: number,

	/**
	 * Thubnail config
	 */
	config: ThumbnailConfig
};

/**
 * Thumbnail configuration
 */
export type ThumbnailConfig = {
	width: number /* Requested thumbnail width */,
	height: number /* Requested thumbnail height */,
	create: boolean,
	type: string,
	gravity: string,
	paddingColor: string,
	method: number
};

/**
 * Media types
 * @type {{IMAGE: number, VIDEO: number, AUDIO: number, DOCUMENT: number}}
 */
export const MediaType = {
	IMAGE: 1,
	VIDEO: 2,
	AUDIO: 3,
	DOCUMENT: 4
};

/**
 * Media type ids
 */
export type MediaTypeId = 1 | 2 | 3 | 4;

/**
 * Media type names
 */
export const MediaTypeName = {
	[MediaType.IMAGE]: 'IMAGE',
	[MediaType.VIDEO]: 'VIDEO',
	[MediaType.AUDIO]: 'AUDIO',
	[MediaType.DOCUMENT]: 'DOCUMENT'
};

export type MediaTypes = $Keys<typeof MediaType>;

/**
 * Media list ordering
 */
export const MediaListOrder = {
	LATEST_UPDATED_DESC: 1,
	LATEST_UPDATED_ASC: 2,
	CREATED_DESC: 3,
	CREATED_ASC: 4,
	CATEGORY_DESC: 5,
	CATEGORY_ASC: 6,
	TITLE_DESC: 7,
	TITLE_ASC: 8,
	USER_DESC: 9,
	USER_ASC: 10,
	RANDOM: 11
};

/**
 * Standard ImageThumbnailConfig names
 * @type {{TINY: string, SMALL: string, MEDIUM: string, LARGE: string}}
 */
export const ThumbnailSize = {
	// Guaranteed to be available
	TINY: 'tiny',
	SMALL: 'small',
	MEDIUM: 'medium',
	LARGE: 'large'
};

/**
 * Given an url, get an url to a thumbnail of the desired size.
 * Effectively inserting the size into the url.
 * @param url
 * @param size
 */
export function getThumbnailUrl({
	url,
	size = ThumbnailSize.MEDIUM
}: {
	url?: ?string,
	size?: string
}): ?string {
	if (typeof url === 'undefined' || url === null) {
		return null;
	}

	let i = url.lastIndexOf('/');
	let p = url.substring(0, i);
	let s = url.substring(i);

	return p + '/' + size + s;
}

/**
 * Get the context prefix
 * @param config
 * @param communityPermalink
 */
export function getContextPrefix({
	config,
	communityPermalink
}: {
	config: api.Config,
	communityPermalink?: string
}): string {
	let cp = '';
	if (typeof communityPermalink === 'undefined') {
		cp = api._getContextPath(config);
	} else {
		if (Stackend.STACKEND_COMMUNITY === communityPermalink) {
			cp = api._getContextPath(config);
		} else {
			cp = api._getContextPath(config) + '/' + communityPermalink;
		}
	}

	return cp;
}

/**
 * Get the absolute context prefix, including server.
 * @param config
 * @param communityPermalink
 * @param context
 */
export function getAbsoluteContextPrefix({
	config,
	communityPermalink,
	context
}: {
	config: api.Config,
	communityPermalink?: string,
	context?: string
}): string {
	// Allows this to be overridden
	let server = api._getConfig({
		config,
		key: 'media-upload-server',
		componentName: 'media',
		context,
		defaultValue: api._getServer(config)
	});

	let cp = getContextPrefix({ config, communityPermalink });

	return server + cp;
}

/**
 * Get the url used to upload a media file.
 * @param config API config
 * @param referenceId {number} Id of another object referencing this media object.
 * @param communityPermalink {string} Community permalink (optional, defaults to current community)
 * @param context {string} Community context
 * @param temporary {Boolean} Mark the media as temporary? Temporary images are subject to automatic removal.
 * @param thumbnail {String} Optional thumbnail configuration name. Determines the size of the returned image
 * @param maxWidth {number} Optional max width. Typically detected from the width of a container element.
 * @param maxHeight {number} Optional max height. Typically detected from the height of a container element.
 */
export function getMediaUploadUrl({
	config,
	referenceId,
	communityPermalink,
	context,
	temporary = false,
	thumbnail,
	maxWidth,
	maxHeight
}: {
	config: api.Config,
	referenceId?: number,
	communityPermalink?: string,
	context: string,
	temporary?: boolean,
	thumbnail?: string,
	maxWidth?: number,
	maxHeight?: number
}): string {
	let cp = getAbsoluteContextPrefix({ config, communityPermalink, context });

	let p =
		cp +
		'/media/upload?context=' +
		context +
		'&temporary=' +
		(typeof temporary === 'undefined' ? 'false' : String(temporary));

	if (typeof thumbnail !== 'undefined') {
		p += '&thumbnail=' + thumbnail;
	}

	if (typeof referenceId !== 'undefined') {
		p += '&referenceId=' + referenceId;
	}

	if (typeof maxWidth !== 'undefined') {
		p += '&maxWidth=' + maxWidth;
	}

	if (typeof maxHeight !== 'undefined') {
		p += '&maxHeight=' + maxHeight;
	}

	return p;
}

/**
 * Get the url used to upload a media file.
 * @param referenceId {number} Id of another object referencing this media object.
 * @param config API config
 * @param communityPermalink {string} Community permalink (optional, defaults to current community)
 * @param context {string} Community context
 * @param temporary {Boolean} Mark the media as temporary? Temporary images are subject to automatic removal.
 * @param thumbnail {String} Optional thumbnail configuration name. Determines the size of the returned image
 * @param maxWidth {number} Optional max width. Typically detected from the width of a container element.
 * @param maxHeight {number} Optional max height. Typically detected from the height of a container element.
 * @param responsive {Boolean} Optional responsive. Sets widht:100%; max-width: <PICTURE WIDTH>px; height: auto
 */
export function getContextMediaUploadUrl({
	referenceId = undefined,
	communityPermalink = undefined,
	context = undefined,
	temporary = false,
	thumbnail = undefined,
	maxWidth = undefined,
	maxHeight = undefined,
	responsive = undefined
}: {
	config: api.Config,
	referenceId?: number,
	communityPermalink?: string,
	context: string,
	temporary?: boolean,
	thumbnail?: string,
	maxWidth?: number,
	maxHeight?: number
}) {
	let cp = getAbsoluteContextPrefix({ communityPermalink, context });

	let p =
		cp +
		'/media/upload?context=' +
		context +
		'&temporary=' +
		(typeof temporary === 'undefined' ? 'false' : String(temporary));

	if (typeof thumbnail !== 'undefined') {
		p += '&thumbnail=' + thumbnail;
	}

	if (typeof referenceId !== 'undefined') {
		p += '&referenceId=' + referenceId;
	}

	if (typeof maxWidth !== 'undefined') {
		p += '&maxWidth=' + maxWidth;
	}

	if (typeof maxHeight !== 'undefined') {
		p += '&maxHeight=' + maxHeight;
	}

	if (typeof responsive !== 'undefined') {
		p += '&responsive=true';
	}
	return p;
}

export type UploadMediaFileResult = {
	/**
	 * Error message, if not successfull
	 */
	error?: string,

	/**
	 * Array of media objects
	 */
	files: Array<MediaObject>,

	/**
	 * Maps from media id to thumbnail. Only present if the thumbnail parameter is set.
	 */
	thumbnails?: Map<string, Thumbnail>,

	/**
	 * Maps from media id to html used for embedding the media object
	 */
	html: Map<string, string>
};

/**
 * Upload a media file.
 *
 * @param config API config
 * @param file {File} file object
 * @param communityPermalink {string} Community permalink (optional, defaults to current community)
 * @param context {string} Community context
 * @param referenceId {number} Id of another object referencing this media object.
 * @param temporary {Boolean} Mark the media as temporary? Temporary images are subject to automatic removal.
 * @param thumbnail {String} Optional thumbnail configuration name. Determines the size of the returned image
 * @param maxWidth {number} Optional max width. Typically detected from the width of a container element.
 * @param maxHeight {number} Optional max height. Typically detected from the height of a container element.
 * @param responsive {Boolean} Optional responsive. Sets widht:100%; max-width: <PICTURE WIDTH>px; height: auto
 * @return {Promise}
 */
export function uploadMediaFile({
	config,
	file = undefined,
	communityPermalink = undefined,
	context = undefined,
	referenceId = undefined,
	temporary = false,
	thumbnail,
	maxWidth,
	maxHeight,
	responsive = undefined
}: {
	config: api.Config,
	file: any,
	communityPermalink?: string,
	context: string,
	referenceId?: number,
	temporary?: boolean,
	thumbnail?: string,
	maxWidth?: number,
	maxHeight?: number,
	responsive: boolean
}): UploadMediaFileResult {
	// Allows the use of COMMUNITY_PARAMETER as well
	if (typeof communityPermalink === 'undefined') {
		communityPermalink = arguments[api.COMMUNITY_PARAMETER];
	}

	let url = getContextMediaUploadUrl({
		config,
		communityPermalink,
		context,
		referenceId,
		temporary,
		thumbnail,
		maxWidth,
		maxHeight,
		responsive
	});
	//console.log("url", url);

	let data = new FormData();
	data.append('file', file);

	let result = LoadJson({
		url,
		method: 'POST',
		parameters: {},
		body: data
	});

	return result;
}

export type ListResult = api.XcapJsonResult & {
	mediaPaginated: PaginatedCollection<MediaObject>,
	thumbnailsByMediaId?: ?Map<string, Thumbnail>
};

/**
 * List my media files.
 *
 * @param context {string} Context (excluding community)
 * @param thumbnailConfigName {string} Thumbnail config name
 * @param mediaType {MediaType} Media type id (optional)
 * @param referenceId {number} Reference id (optional)
 * @param categoryId {number} Category id (optional)
 * @param order {MediaListOrder} Sort order (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listMy({
	context,
	thumbnailConfigName = 'medium',
	mediaType,
	referenceId,
	categoryId,
	order = MediaListOrder.CREATED_DESC,
	pageSize,
	p = 1
}: {
	context: string,
	thumbnailConfigName?: string,
	mediaType?: number,
	referenceId?: number,
	categoryId?: number,
	order?: number,
	pageSize?: number,
	p?: number
}): Thunk<ListResult> {
	return api.getJson({ url: '/media/list/my', parameters: arguments });
}

/**
 * List media files.
 *
 * @param context {string} Context (excluding community)
 * @param thumbnailConfigName {string} Thumbnail config name
 * @param mediaType {MediaType} Media type id (optional)
 * @param referenceId {number} Reference id (optional)
 * @param categoryId {number} Category id (optional)
 * @param order {MediaListOrder} Sort order (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function list({
	context,
	thumbnailConfigName = 'medium',
	mediaType,
	referenceId,
	categoryId,
	order = MediaListOrder.CREATED_DESC,
	pageSize,
	p = 1
}: {
	context: string,
	thumbnailConfigName?: string,
	mediaType?: number,
	referenceId?: number,
	categoryId?: number,
	order?: number,
	pageSize?: number,
	p?: number
}): Thunk<ListResult> {
	return api.getJson({ url: '/media/list', parameters: arguments });
}

/**
 * Remove a media object (by setting modstatus).
 *
 * @param communityPermalink {string} Community permalink (optional, defaults to current community)
 * @param context {string} Context (excluding community)
 * @param id {number} Media id
 */
export function remove({
	communityPermalink,
	context,
	id
}: {
	communityPermalink?: string,
	context: string,
	id: number
}): Thunk<*> {
	/*
	let url = Media.getAbsoluteContextPrefix({communityPermalink, context}) + "/media/remove";
	console.log("url", url);
	let result = LoadJson(url, 'POST', { id, context }, null, null);
	return result;
	*/
	!!arguments[0].communityPermalink && delete arguments[0].communityPermalink;
	return api.post({ url: '/media/remove', parameters: arguments, community: communityPermalink });
}

export type GetMediaResult = api.XcapJsonResult & {
	media: ?MediaObject,

	/** Thumbnail, if thumbnailConfigName is set */
	thumbnail: ?ImageThumbnail,

	/** Html for embedding */
	html: ?string
};

/**
 * Get a media file.
 *
 * @param context {string} Context (excluding community)
 * @param thumbnailConfigName {string} Thumbnail config name (optional)
 * @param id {number} id (optional)
 * @param permalink {string} permalink (optional)
 * @param responsive {boolean} Generate responsive html
 * @return {Thunk<*>}
 */
export function get({
	context,
	thumbnailConfigName = 'medium',
	id,
	permalink,
	responsive
}: {
	context: string,
	thumbnailConfigName?: string,
	id?: number,
	permalink?: string,
	responsive?: ?boolean
}): Thunk<GetMediaResult> {
	return api.getJson({ url: '/media/get', parameters: arguments });
}

export type EmbedResult = XcapJsonResult & {
	/* Mime type of embedded content (text/html) */
	mimeType: string,

	/* Max width (set by thumbnailConfig or maxWidth parameter) */
	maxWidth: number,

	/* Type of embedding */
	richContentEmbedding: 'NOT_SUPPORTED' | 'LINK' | 'EMBED',

	/* Html to embed */
	html: string,

	/* Additional data extracted from the embed code */
	data: ?{
		image?: Image,
		thumbnail?: ImageThumbnail,
		title?: string,
		description?: string,
		textsample?: string
	}
};

/**
 * Validate a html fragment, a link, iframe, video for embedding in rich content.
 *
 * Url - Create some sample data from the site.
 * Video url  - the corresponding embed code is created (youtube, vimeo).
 * Iframe/img tags - The src is checked against the whitelist.
 *
 * @param context {string} Context (excluding community)
 * @param embedCode
 * @param thumbnailConfigName {string} Thumbnail config name (optional)
 * @param maxWidth (optional)
 * @param responsive Use responsive layout: 100% width, or smaller if smaller.
 * @param communityPermalink {string} Community permalink (optional, defaults to current community)
 */
export function embed({
	context,
	embedCode,
	thumbnailConfigName,
	maxWidth,
	responsive,
	communityPermalink
}: {
	context: string,
	embedCode: string,
	thumbnailConfigName?: string,
	maxWidth?: number,
	responsive?: boolean,
	communityPermalink?: string
}): Thunk<EmbedResult> {
	!!arguments[0].communityPermalink && delete arguments[0].communityPermalink;
	return api.getJson({ url: '/media/embed', parameters: arguments, community: communityPermalink });
}

export type SearchUsesResult = XcapJsonResult & {
	uses: Array<Reference>
};

/**
 * Search for media uses
 *
 * @param mediaId
 * @param context
 */
export function searchUses({
	context,
	mediaId
}: {
	context: string,
	mediaId?: number
}): Thunk<SearchUsesResult> {
	return api.getJson({
		url: '/media/search-uses',
		parameters: arguments
	});
}

/**
 * Construct a fake image thumbnail
 * @param image
 * @returns ImageThumbnail
 */
export function constructImageThumbnail(image: Image, thumbnailConfig): ImageThumbnail {
	if (!image) {
		return null;
	}

	return {
		id: -1,
		url: image.url,
		bytes: image.bytes,
		mediaId: image.id,
		createdDate: image.createdDate,
		height: image.height,
		width: image.width,
		mediaType: MediaTypeName[MediaType.IMAGE]
	};
}
