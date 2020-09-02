//@flow
import * as Stackend from '../stackend';
import { LoadJson, LoadJsonResult } from '../api/LoadJson';
import type { PaginatedCollection } from '../api/PaginatedCollection';
import {
  getJson,
  post,
  COMMUNITY_PARAMETER,
  XcapJsonResult,
  Reference,
  XcapObject,
  Config,
  _getServer,
  _getContextPath,
  _getConfig,
  Thunk,
  XcapOptionalParameters,
} from '../api';
import { User } from '../user';
import _ from 'lodash';

/**
 * Image
 */
export enum MediaStatus {
  OK = 'OK',
  NOT_OK = 'NOT_OK',
  NOT_PROCESSED = 'NOT_PROCESSED',
  TEMPORARY = 'TEMPORARY',
}

export interface Media extends XcapObject {
  createdDate: number;
  originalName: string;
  referenceId: number;
  status: MediaStatus;
  title: string;
  description: string;

  mediaType: MediaTypeNames;

  /** Mime type: image/jpg etc */
  mimeType: string;

  /** File size in bytes */
  bytes: number;

  /** File size as string 46.1KB */
  size: string;

  creatorUserId: number;

  creatorUserRef: User | null;

  modifiedDate: Date;

  /** Url to original media file */
  url: string;
}

export interface Image extends Media {
  __type: 'net.josh.community.media.Image';
  width: number;
  height: number;
}

export interface Video extends Media {
  __type: 'net.josh.community.media.Video';
  width: number;
  height: number;
  /* Disabled for now. Use url instead: finalVideoUrl: string,*/
  /** Length in seconds */
  length: number;
}

export interface Document extends Media {
  __type: 'net.josh.community.media.Document';
}

export interface Audio extends Media {
  __type: 'net.josh.community.media.Audio';
  /** Length in seconds */
  length: number;
}

/**
 * Image, Document, Video or Audio
 */
export type MediaObject = Image | Document | Video | Audio;

export interface Thumbnail {
  id: number;
  /** Media object id */
  mediaId: number;

  /** Url to the thumbnail file */
  url: string;
}

/**
 * Image thumbnail
 */
export interface ImageThumbnail extends Thumbnail {
  /** Actual thumbnail width (as opposed to requested width in the ThubnailConfig) */
  width: number;

  /** Actual thumbnail height (as opposed to requested width in the ThubnailConfig) */
  height: number;

  /** Size in bytes*/
  bytes: number;

  /**
   * Media type id
   */
  mediaType: MediaTypeNames;

  /**
   * Created date
   */
  createdDate: number;

  /**
   * Thubnail config
   */
  config: ThumbnailConfig;
}

/**
 * Thumbnail configuration
 */
export interface ThumbnailConfig {
  width: number /* Requested thumbnail width */;
  height: number /* Requested thumbnail height */;
  create: boolean;
  type: string;
  gravity: string;
  paddingColor: string;
  method: number;
}

/**
 * Media types
 * @type {{IMAGE: number, VIDEO: number, AUDIO: number, DOCUMENT: number}}
 */
export enum MediaType {
  IMAGE = 1,
  VIDEO = 2,
  AUDIO = 3,
  DOCUMENT = 4,
}

/**
 * Media type ids
 */
export type MediaTypeId = 1 | 2 | 3 | 4;

export type MediaTypeNames = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
/**
 * Media type names
 */
export const MediaTypeName: { [mediaTypeId: number]: MediaTypeNames } = {
  [MediaType.IMAGE]: 'IMAGE',
  [MediaType.VIDEO]: 'VIDEO',
  [MediaType.AUDIO]: 'AUDIO',
  [MediaType.DOCUMENT]: 'DOCUMENT',
};

/**
 * Media list ordering
 */
export enum MediaListOrder {
  LATEST_UPDATED_DESC = 1,
  LATEST_UPDATED_ASC = 2,
  CREATED_DESC = 3,
  CREATED_ASC = 4,
  CATEGORY_DESC = 5,
  CATEGORY_ASC = 6,
  TITLE_DESC = 7,
  TITLE_ASC = 8,
  USER_DESC = 9,
  USER_ASC = 10,
  RANDOM = 11,
}

/**
 * Standard ImageThumbnailConfig names
 * @type {{TINY: string, SMALL: string, MEDIUM: string, LARGE: string}}
 */
export const ThumbnailSize = {
  // Guaranteed to be available
  TINY: 'tiny',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

/**
 * Given an url, get an url to a thumbnail of the desired size.
 * Effectively inserting the size into the url.
 * @param url
 * @param size
 */
export function getThumbnailUrl({
  url,
  size = ThumbnailSize.MEDIUM,
}: {
  url?: string | null;
  size?: string;
}): string | null {
  if (typeof url === 'undefined' || url === null) {
    return null;
  }

  const i = url.lastIndexOf('/');
  const p = url.substring(0, i);
  const s = url.substring(i);

  return p + '/' + size + s;
}

/**
 * Get the context prefix
 * @param config
 * @param communityPermalink
 */
export function getContextPrefix({
  config,
  communityPermalink,
}: {
  config: Config;
  communityPermalink?: string;
}): string {
  let cp = '';
  if (typeof communityPermalink === 'undefined') {
    cp = _getContextPath(config);
  } else {
    if (Stackend.STACKEND_COMMUNITY === communityPermalink) {
      cp = _getContextPath(config);
    } else {
      cp = _getContextPath(config) + '/' + communityPermalink;
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
  context,
}: {
  config: Config;
  communityPermalink?: string;
  context?: string;
}): string {
  // Allows this to be overridden
  const server = _getConfig({
    config,
    key: 'media-upload-server',
    componentName: 'media',
    context,
    defaultValue: _getServer(config),
  });

  const cp = getContextPrefix({ config, communityPermalink });

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
  maxHeight,
}: {
  config: Config;
  referenceId?: number;
  communityPermalink?: string;
  context: string;
  temporary?: boolean;
  thumbnail?: string;
  maxWidth?: number;
  maxHeight?: number;
}): string {
  const cp = getAbsoluteContextPrefix({ config, communityPermalink, context });

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
  config,
  referenceId = undefined,
  communityPermalink = undefined,
  context = undefined,
  temporary = false,
  thumbnail = undefined,
  maxWidth = undefined,
  maxHeight = undefined,
  responsive = undefined,
}: {
  config: Config;
  referenceId?: number;
  communityPermalink?: string;
  context?: string;
  temporary?: boolean;
  thumbnail?: string;
  maxWidth?: number;
  maxHeight?: number;
  responsive?: boolean;
}): string {
  const cp = getAbsoluteContextPrefix({ config, communityPermalink, context });

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

export interface UploadMediaFileResult {
  /**
   * Error message, if not successful
   */
  error?: string;

  /**
   * Array of media objects
   */
  files: Array<MediaObject>;

  /**
   * Maps from media id to thumbnail. Only present if the thumbnail parameter is set.
   */
  thumbnails?: { [id: string]: Thumbnail };

  /**
   * Maps from media id to html used for embedding the media object
   */
  html: { [id: string]: string };
}

export interface UploadMediaFileRequest {
  file: File;
  communityPermalink?: string;
  context?: string;
  referenceId?: number;
  temporary?: boolean;
  thumbnail?: string;
  maxWidth?: number;
  maxHeight?: number;
  responsive?: boolean;
}

/**
 * Upload a media file. Browser only.
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
export async function uploadMediaFile({
  config,
  file,
  communityPermalink = undefined,
  context = undefined,
  referenceId = undefined,
  temporary = false,
  thumbnail,
  maxWidth,
  maxHeight,
  responsive = undefined,
}: {
  config: Config;
} & UploadMediaFileRequest &
  XcapOptionalParameters): Promise<UploadMediaFileResult> {
  // Allows the use of COMMUNITY_PARAMETER as well
  if (typeof communityPermalink === 'undefined') {
    // @ts-ignore
    communityPermalink = arguments[COMMUNITY_PARAMETER];
  }

  const url = getContextMediaUploadUrl({
    config,
    communityPermalink,
    context,
    referenceId,
    temporary,
    thumbnail,
    maxWidth,
    maxHeight,
    responsive,
  });
  //console.log("url", url);

  const data = new FormData();
  data.append('file', file);

  // Outside the normal api path
  const r: LoadJsonResult = await LoadJson({
    url,
    method: 'POST',
    parameters: {},
    body: data,
  });

  // FIXME: Handle cookies

  // This json format includes it's own error messages.
  if (r.error) {
    return {
      error: r.error,
      files: [],
      html: {},
      thumbnails: {},
    };
  }

  return r.json as any;
}

/**
 * Upload a media file. Browser only.
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
export function upload({
  file,
  context = undefined,
  referenceId = undefined,
  temporary = false,
  thumbnail,
  maxWidth,
  maxHeight,
  responsive = undefined,
  communityPermalink = undefined,
}: UploadMediaFileRequest & XcapOptionalParameters): Thunk<Promise<UploadMediaFileResult>> {
  let cpl = communityPermalink;
  if (typeof cpl === 'undefined') {
    // @ts-ignore
    cpl = arguments[COMMUNITY_PARAMETER];
  }

  return (dispatch, getState): Promise<UploadMediaFileResult> => {
    const { config, communities } = getState();

    if (!cpl) {
      cpl = _.get(communities, 'community.permalink');
    }

    return uploadMediaFile({
      config,
      file,
      communityPermalink: cpl,
      context,
      referenceId,
      temporary,
      thumbnail,
      maxWidth,
      maxHeight,
      responsive,
    });
  };
}

export interface ListResult extends XcapJsonResult {
  mediaPaginated: PaginatedCollection<MediaObject>;
  thumbnailsByMediaId?: { [mediaId: string]: Thumbnail } | null;
}

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
  p = 1,
}: {
  context: string;
  thumbnailConfigName?: string;
  mediaType?: number;
  referenceId?: number;
  categoryId?: number;
  order?: MediaListOrder;
  pageSize?: number;
  p?: number;
} & XcapOptionalParameters): Thunk<Promise<ListResult>> {
  return getJson({ url: '/media/list/my', parameters: arguments });
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
  p = 1,
}: {
  context: string;
  thumbnailConfigName?: string;
  mediaType?: number;
  referenceId?: number;
  categoryId?: number;
  order?: number;
  pageSize?: number;
  p?: number;
} & XcapOptionalParameters): Thunk<Promise<ListResult>> {
  return getJson({ url: '/media/list', parameters: arguments });
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
  id,
}: {
  communityPermalink?: string;
  context: string;
  id: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  /*
	let url = Media.getAbsoluteContextPrefix({communityPermalink, context}) + "/media/remove";
	console.log("url", url);
	let result = LoadJson(url, 'POST', { id, context }, null, null);
	return result;
	*/
  !!arguments[0].communityPermalink && delete arguments[0].communityPermalink;
  return post({
    url: '/media/remove',
    parameters: arguments,
    community: communityPermalink,
  });
}

export interface GetMediaResult extends XcapJsonResult {
  media: MediaObject | null;

  /** Thumbnail, if thumbnailConfigName is set */
  thumbnail: ImageThumbnail | null;

  /** Html for embedding */
  html: string | null;
}

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
  responsive,
}: {
  context: string;
  thumbnailConfigName?: string;
  id?: number;
  permalink?: string;
  responsive?: boolean;
} & XcapOptionalParameters): Thunk<Promise<GetMediaResult>> {
  return getJson({ url: '/media/get', parameters: arguments });
}

export interface EmbedResult extends XcapJsonResult {
  /* Mime type of embedded content (text/html) */
  mimeType: string;

  /* Max width (set by thumbnailConfig or maxWidth parameter) */
  maxWidth: number;

  /* Type of embedding */
  richContentEmbedding: 'NOT_SUPPORTED' | 'LINK' | 'EMBED';

  /* Html to embed */
  html: string;

  /* Additional data extracted from the embed code */
  data: null | {
    image?: Image;
    thumbnail?: ImageThumbnail;
    title?: string;
    description?: string;
    textsample?: string;
  };
}

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
  communityPermalink,
}: {
  context: string;
  embedCode: string;
  thumbnailConfigName?: string;
  maxWidth?: number;
  responsive?: boolean;
  communityPermalink?: string;
} & XcapOptionalParameters): Thunk<Promise<EmbedResult>> {
  !!arguments[0].communityPermalink && delete arguments[0].communityPermalink;
  return getJson({
    url: '/media/embed',
    parameters: arguments,
    community: communityPermalink,
  });
}

export interface SearchUsesResult extends XcapJsonResult {
  uses: Array<Reference>;
}

/**
 * Search for media uses
 *
 * @param mediaId
 * @param context
 */
export function searchUses({
  context,
  mediaId,
}: {
  context: string;
  mediaId?: number;
} & XcapOptionalParameters): Thunk<Promise<SearchUsesResult>> {
  return getJson({
    url: '/media/search-uses',
    parameters: arguments,
  });
}

/**
 * Construct a fake image thumbnail
 * @param image
 * @returns ImageThumbnail
 */
export function constructImageThumbnail(image: Image, thumbnailConfig: string): ImageThumbnail | null {
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
    mediaType: MediaTypeName[MediaType.IMAGE],
    config: {
      create: false,
      gravity: 'CENTER',
      height: image.height,
      method: 0,
      paddingColor: 'pink',
      type: 'DEFAULT',
      width: image.width,
    },
  };
}
