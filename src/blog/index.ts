import { createCommunityUrl, getJson, logger, post, Thunk, XcapJsonResult, XcapOptionalParameters } from "../api";
import * as event from "../event";
import { CurrentUserRsvpStatuses } from "../event";
import { Poll } from "../poll";
import * as group from "../group";
//import * as gaFunctions from '../functions/gaFunctions';
import { Request } from "../request";
import { Category } from "../category";
import { VoteSummary } from "../vote";
import { Image } from "../media";
import { AuthObject } from "../user/privileges";
import { PaginatedCollection } from "../api/PaginatedCollection";
import { LikeDataMap } from "../like";
import CreatedDateAware from "../api/CreatedDateAware";
import CreatorUserIdAware from "../api/CreatorUserIdAware";
import XcapObject from "../api/XcapObject";
import NameAware from "../api/NameAware";
import DescriptionAware from "../api/DescriptionAware";
import PermalinkAware from "../api/PermalinkAware";
import ModifiedDateAware from "../api/ModifiedDateAware";
import ReferenceAble from "../api/ReferenceAble";
import PublishDateAware from "../api/PublishDateAware";
import ModerationAware from "../api/ModerationAware";
import ReferenceIdAware from "../api/ReferenceIdAware";
import { RsvpUserResponses } from "../event/eventReducer";
import { normalizeTags } from "../tags";

/**
 * Xcap Blog api constants and methods.
 *
 * @since 6 feb 2017
 */

/**
 * The default blog key
 * @type {string}
 */
export const DEFAULT_BLOG_KEY = 'news';

/**
 * Default context for the blog
 * @type {string}
 */
export const DEFAULT_CONTEXT = 'news';

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS = 'net.josh.community.blog.BlogManager';

/**
 * Component name
 * @type {string}
 */
export const COMPONENT_NAME = 'blog';

/**
 * Blog entry class name
 */
export const BLOG_ENTRY_CLASS = 'net.josh.community.blog.BlogEntry';

/**
 * Statuses of a blog entry
 */
export enum BlogEntryStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  DELETED = 'DELETED'
}

export type FeedType = 'groups' | 'blog' | 'discussion';

/**
 * Blog entry definition
 */
export type SlideId = number; //Id of slide image
export type SlideHtml = string; //url to image of slide
export type Slide = SlideId | SlideHtml;

export interface Slideshow {
  frame: boolean;
  shadow: boolean;
  hasImageSlide: boolean;
  hasVideoSlide: boolean;
  empty: boolean;
  slides: Array<{ slide: Slide }>;
}

export interface BlogEntry
  extends XcapObject,
    NameAware,
    DescriptionAware,
    PermalinkAware,
    CreatorUserIdAware,
    CreatedDateAware,
    ModifiedDateAware,
    ModerationAware,
    ReferenceAble,
    PublishDateAware {
  __type: 'net.josh.community.blog.BlogEntry';
  blogId: number;
  blogRef: Blog;
  type: string;
  body: string;
  plainTextBody: string;
  categoryRef: Array<any>;
  slideshow?: Slideshow;
  eventRef?: event.Event;
  pollRef?: Poll;
  numberOfComments: number;
  numberOfLikes: number;
  tags?: string[];
  pageId?: number;
}

/**
 * Blog definition
 */
export interface Blog
  extends XcapObject,
    NameAware,
    DescriptionAware,
    PermalinkAware,
    CreatedDateAware,
    ModifiedDateAware,
    ModerationAware,
    ReferenceIdAware<XcapObject>,
    ReferenceAble {
  __type: 'net.josh.community.blog.Blog';
  creatorUserRef: any;
  categoryRef: any;
  css: number;
  cssName: string;
  /**
   * Number of entries
   */
  entrySize: number;
  groupRef: group.Group /** Owning group */;
  publishedEntrySize: number;
  subtype: number;
  type: number;
}

/**
 * Blog with auth information
 */
export interface AuthBlog extends Blog {
  auth: AuthObject;
}

export interface BlogEntries {
  __relatedObjects: any;
  blogId: number;
  blogKey: string;
  likesByCurrentUser: any;
  resultPaginated: {
    entries: Array<BlogEntry>;
  };
  userRsvpStatuses: any;
}

/**
 * Get the first image of the slideshow
 * @param slideshow
 * @returns {*}
 */
export function getFirstSlideshowImageUrl(slideshow: Slideshow | null): string | null {
  if (typeof slideshow === undefined || slideshow === null || !slideshow.hasImageSlide) {
    return null;
  }

  // FIXME: May be video
  const x: any = slideshow.slides[0];
  if (typeof x === 'string') {
    return x;
  }
  return null;
}

/**
 * returns the url to a specific Blog Entry
 */
export function getBlogEntryUrl({ request, entry }: { request: Request; entry: BlogEntry }): string {
  try {
    const blogPermalink = entry.blogRef.groupRef ? entry.blogRef.groupRef.permalink : entry.blogRef.permalink;

    return createCommunityUrl({
      request,
      path: '/' + blogPermalink + '/posts/' + entry.permalink
    });
  } catch (e) {
    logger.error(e, 'Could not find Entry url:' + JSON.stringify(entry));
    return '';
  }
}

/**
 * Create a new blogEntry that is ok to save.
 * @returns BlogEntry
 */
export function newBlogEntry(blogKey: string): SaveBlogEntryInput {
  //FIXME: a lot of hardcoded stuff, not sure what is necessary
  return {
    id: 0,
    __type: 'net.josh.community.blog.BlogEntry',
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
      slides: [],
      hasImageSlide: false,
      hasVideoSlide: false,
      empty: true
    },
    tags: [],
    pageId: 0
  };
}

export interface GetBlogParams extends XcapOptionalParameters {
  blogId?: number;
  blogKey?: string;
}

export interface GetBlogResult extends XcapJsonResult {
  blog: Blog | null;
  // FIXME: this is backend a bug?
  authBlog: AuthBlog | AuthObject | null;
}

/**
 * Get a blog given blogId or blogKey
 * @param parameters
 */
export function getBlog({ blogId, blogKey }: GetBlogParams): Thunk<Promise<GetBlogResult>> {
  return getJson({ url: '/blog/get', parameters: arguments });
}

export interface BlogEntryListingResult extends XcapJsonResult {
  resultPaginated: PaginatedCollection<BlogEntry>;
}

export interface GetEntriesResult extends BlogEntryListingResult {
  likes: LikeDataMap;
  userRsvpStatuses: CurrentUserRsvpStatuses;

  /** Maps from event id to status to list */
  rsvpUserIds: RsvpUserResponses;

  likesByCurrentUser: LikeDataMap;

  categories: Array<Category>;
  blog: Blog | null;
  authBlog: AuthBlog | null;
  auth: AuthObject | null;
}

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
  goToBlogEntry,
  tags
}: XcapOptionalParameters & {
  q?: string;
  blogKey?: string;
  blogId?: number;
  creatorUserId?: number;
  author?: string;
  p?: number;
  pageSize?: number;
  categoryPermaLink?: string;
  categoryId?: number;
  goToBlogEntry?: string;
  tags?: string[];
}): Thunk<Promise<GetEntriesResult>> {
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
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<BlogEntryListingResult>> {
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
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<BlogEntryListingResult>> {
  return getJson({ url: '/blog/entries/most-popular', parameters: arguments });
}

// FIXME: Use same format as other listings
export interface GetMostCommentedEntriesResult extends XcapJsonResult {
  mostCommentedPaginated: PaginatedCollection<BlogEntry>;
}

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
  daysBack?: number;
  startDate?: any;
  endDate?: any;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<GetMostCommentedEntriesResult>> {
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
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<BlogEntryListingResult>> {
  return getJson({ url: '/blog/entries/recommended', parameters: arguments });
}

export interface GetBlogEntryResult extends XcapJsonResult {
  likes: LikeDataMap;
  tags: Array<string>;
  categories: Array<Category>;
  voteSummary: VoteSummary;
  pinned: boolean;
  numberOfComments: number;
  blogKey: string;
  isEditAllowed: boolean;
  views: number;
  mainArticleImages: Array<Image>;
  blogEntry: BlogEntry | null;
}

/**
 * Get a blog entry.
 *
 * @param id Blog entry id (required)
 * @param permalink
 */
export function getEntry({
  id,
  entryPermaLink,
  blogKey,
  blogId
}: {
  id?: number;
  entryPermaLink?: string;
  blogKey?: string;
  blogId?: number;
} & XcapOptionalParameters): Thunk<Promise<GetBlogEntryResult>> {
  return getJson({ url: '/blog/entry/get', parameters: arguments });
}

export interface SetEntryStatusResult extends XcapJsonResult {
  entry: BlogEntry;
  categories: Array<Category>;
  blog: Blog;
  authBlog: AuthBlog;
}

export interface SetEntryStatus extends XcapOptionalParameters {
  blogKey: string;
  id: number;
  status: BlogEntryStatus;
}

/**
 * Set the status of the blog entry.
 *
 * @param id
 * @param blogKey
 * @param status
 * @returns {Promise}
 */
export function setEntryStatus({ blogKey, id, status }: SetEntryStatus): Thunk<Promise<SetEntryStatusResult>> {
  return post({ url: '/blog/entry/set-status', parameters: arguments });
}

export interface SaveEntryResult extends XcapJsonResult {
  permalink: string | null;
  blogKey: string | null;
  draftId: number;
  entry: BlogEntry | null;
}

export interface SaveBlogEntryPollAnswer {
  id: number;
  answer: string;
}

export interface SaveBlogEntryPoll {
  description: string;
  answers: Array<SaveBlogEntryPollAnswer>;
}

export interface SaveBlogEntrySlideshow {
  slides: Array<string>;
  frame: boolean;
  shadow: boolean;
  hasImageSlide?: boolean;
  hasVideoSlide?: boolean;
  empty?: boolean;
}

export interface SaveBlogEntryEvent {
  title: string;
  /** Start date yyyy-MM-dd HH:mm (time part discarded) */
  startDate: string;
  /** Start time: HH:mm */
  startTime: string;
  /** End date yyyy-MM-dd HH:mm (time part discarded) */
  endDate: string;
  /** End time: HH:mm */
  endTime: string;
  location: string;
  link: string;
}

export interface SaveBlogEntryInput {
  id: number;
  __type: 'net.josh.community.blog.BlogEntry';
  blogKey: string;
  title: string;
  description: string;
  body: string;
  /** Publish date yyyy-MM-dd HH:mm */
  publishDate: string | null;
  allowComments: boolean;
  categories?: Array<number>;
  poll?: SaveBlogEntryPoll;
  event?: SaveBlogEntryEvent;
  slideshow?: SaveBlogEntrySlideshow;
  tags?: Array<string>;
  pageId?: number;
  /** old deprecated stuff */
  headerStyle?: any;
}

/**
 * Save a blog entry.
 * @param blogEntryJson
 * @param type
 * @param draftId
 * @param blogKey
 * @returns {Promise}
 */
export function saveEntry({
  blogEntryInput,
  type,
  draftId,
  blogKey
}: {
  blogEntryInput: SaveBlogEntryInput;
  type: any;
  draftId?: number;
  blogKey: string;
} & XcapOptionalParameters): Thunk<Promise<SaveEntryResult>> {
  return post({
    url: '/blog/save-blog-entry',
    parameters: {
      blogEntryJson: JSON.stringify(blogEntryInput),
      draftId,
      type,
      blogKey
    }
  });
}

/**
 * Get a composite blog key that consists of the normal blog key plus eventual tags in the form:
 * groups/social/feed/tags/mytag
 *
 * Use this to fetch from redux whn using tags
 *
 * @param blogKey
 * @param tags
 */
export function getCompositeBlogKey({ blogKey, tags }: { blogKey: string; tags?: string[] }): string {
  const normalizedTags = normalizeTags(tags);
  let bk = blogKey;
  if (normalizedTags.length) {
    bk += '/tags/' + normalizedTags.join('/');
  }
  return bk;
}

/*
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
*/
