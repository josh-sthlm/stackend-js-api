import { getJson, post, XcapJsonResult, Thunk } from '../api';
import { ModerationStatus, ModerationStatusCode, ModerationStatusCodes } from '../api/ModerationStatus';
import { Order } from '../api/Order';
import ModerationVisibility from '../api/ModerationVisibility';
import { User } from '../user';
import { PaginatedCollection } from '../api/PaginatedCollection';
import XcapObject from '../api/XcapObject';

/**
 * Result of a single content filter
 */
export interface ContentFilterResult {
  /** Name of the content filter */
  filterName: string;

  /** Resulting moderation status */
  modStatus: ModerationStatusCodes;

  /** Optional values indicating why a filter modified the modStatus, for example SPOOF: 3 */
  keyValues: { [key: string]: string | number };

  /** Labels assigned, for example keywords when scanning text or images */
  labels: Array<string>;
}

/**
 * Result of content filtering
 */
export interface ContentFilterResults {
  /** Over all resulting moderation status (most restrictive of all filters) */
  modStatus: ModerationStatusCodes;

  /** Results from individual content filtering plugins */
  results: Array<ContentFilterResult>;
}

/**
 * Get the most restrictive ModerationStatus status
 * @param m1
 * @param m2
 * @returns {string}
 */
export function getMostRestrictiveModerationStatus(m1: ModerationStatus, m2: ModerationStatus): ModerationStatus {
  if (m1 === ModerationStatus.NOT_PASSED || m2 === ModerationStatus.NOT_PASSED) {
    return ModerationStatus.NOT_PASSED;
  }

  if (m1 === ModerationStatus.PRE || m2 === ModerationStatus.PRE) {
    return ModerationStatus.PRE;
  }

  if (m1 === ModerationStatus.POST || m2 === ModerationStatus.POST) {
    return ModerationStatus.POST;
  }

  if (m1 === ModerationStatus.NONE || m2 === ModerationStatus.NONE) {
    return ModerationStatus.NONE;
  }

  return ModerationStatus.PASSED;
}

/**
 * Get the most restrictive mod status
 * @param m1
 * @param m2
 * @returns {number}
 */
export function getMostRestrictiveModStatus(m1: number, m2: number): ModerationStatusCodes {
  if (m1 === 2 || m2 === 2) {
    return 2;
  }

  if (m1 === 4 || m2 === 4) {
    return 4;
  }

  if (m1 === 5 || m2 === 5) {
    return 5;
  }

  if (m1 === 0 || m2 === 0) {
    return 0;
  }

  if (m1 === 1 || m2 === 1) {
    return 1;
  }

  return 0;
}

/**
 * Combine all content filter results to a single result
 * @param results
 */
export function combineContentFilterResults(results: Array<ContentFilterResult>): ContentFilterResult {
  const r: ContentFilterResult = {
    filterName: '',
    modStatus: ModerationStatusCode[ModerationStatus.NONE] as ModerationStatusCodes,
    keyValues: {},
    labels: []
  };

  if (!results || results.length === 0) {
    return r;
  }

  results.forEach(x => {
    r.modStatus = getMostRestrictiveModStatus(x.modStatus, r.modStatus);
    if (x.keyValues) {
      Object.keys(x.keyValues).map(key => {
        const v = x.keyValues[key];
        const n = r.keyValues[key];
        if (!n || parseInt(v + '') > parseInt(n + '')) {
          r.keyValues[key] = v;
        }
      });
    }
    // TODO: Labels ignored
  });

  return r;
}

/**
 * Check if a an object is visible
 * @param object
 * @returns {boolean}
 */
export function isVisible(object: XcapObject): boolean {
  if (!object) {
    return false;
  }

  const o = object as any;
  if (typeof o.modStatus === 'undefined') {
    return true;
  }

  switch (o.modStatus) {
    case ModerationStatus.NONE:
    case ModerationStatus.PASSED:
      return true;

    case ModerationStatus.NOT_PASSED:
    case ModerationStatus.PRE:
      return false;

    case ModerationStatus.POST:
      if (o.expiresDate) {
        const now = new Date();
        return o.expiresDate > now.getTime();
      } else if (o.ttl && o.createdDate) {
        const now = new Date();
        const expires = o.createdDate + o.ttl * 60 * 1000;
        return expires > now.getTime();
      }

      return false;
  }

  return true;
}

export enum OrderBy {
  SCORE = 'SCORE',
  CREATED_DATE = 'CREATED_DATE',
  VIEWS = 'VIEWS',
  VOTE_AVERAGE = 'VOTE_AVERAGE'
}

export interface Search {
  q: string;
  type: string;
  author: any;
  groupId: number;
  /** Find objects with abuse reports */
  hasAbuseReports?: boolean;
  moderationVisibility: ModerationVisibility;
  orderBy: OrderBy;
  order: Order;
  p: number; //page number
  communityPermalink: string;
}

export interface SearchResult extends XcapJsonResult {
  /** Results */
  results: PaginatedCollection<XcapObject>;

  /** Number of abuse reports */
  nAbuseReports: number;

  /** Number of objects awaiting moderation */
  nAwaitingModeration: number;

  /** Number of objects where moderation has expired */
  nModerationExpired: number;

  /** Maps from community user id to stackend user */
  adminUserMapping: { [id: number]: User };

  /** Maps from obfuscatedReference to result from content filtering results */
  contentFilterResults: { [obfuscatedReference: string]: ContentFilterResults };

  /** Stop words found in the result. Maps from obfuscatedReference to word */
  stopWords: {
    [obfuscatedReference: string]: string;
  };
}

/**
 * Search for objects to moderate.
 *
 * This search can find all objects in the system. The default is to only show objects that requires moderation.
 *
 * @param q {String} Search expression
 * @param p {number} Page number
 * @param type {String} all|article|comment|group|...
 * @param groupIds {number}
 * @param moderationVisibility {moderationVisibility} Default: ModerationVisibility.MODERATION_PENDING
 * @param orderBy {orderBy} Default: CREATED_DATE
 * @param order {order} Default: ASCENDING
 * @param communityPermalink type {String}
 * @return {Promise}
 */
export function search({
  q,
  type = 'all',
  author,
  groupId,
  moderationVisibility = ModerationVisibility.MODERATION_PENDING,
  orderBy = OrderBy.CREATED_DATE,
  order = Order.ASCENDING,
  communityPermalink,
  p
}: Search): Thunk<Promise<SearchResult>> {
  !!arguments[0].communityPermalink && delete arguments[0].communityPermalink;
  return getJson({ url: '/admin/search', parameters: arguments, community: communityPermalink });
}

export type SetModStatus = {
  obfuscatedReference: string;
  approved: boolean;
};

/**
 * Change moderation status for a single object.
 *
 * @param {String} obfuscatedReference
 * @param {Boolean} approved
 * @return {Promise}
 */
export function setModStatus({ obfuscatedReference, approved }: SetModStatus): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/admin/moderate', parameters: arguments });
}

export type SetModStatuses = {
  obfuscatedReferences: Array<string>;
  approved: boolean;
};

/**
 * Change moderation status for multiple objects.
 *
 * @param obfuscatedReferences {Array} A list of obfuscatedReference
 * @param approved {Boolean}
 * @return {Promise}
 */
export function setModStatuses({ obfuscatedReferences, approved }: SetModStatuses): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/admin/moderate-multiple', parameters: arguments });
}
