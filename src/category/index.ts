import { getJson, post, XcapJsonResult, Thunk } from '../api';
import XcapObject from '../api/XcapObject';
import NameAware from '../api/NameAware';
import DescriptionAware from '../api/DescriptionAware';
import PermalinkAware from '../api/PermalinkAware';
import CreatedDateAware from '../api/CreatedDateAware';
import ReferenceAble from '../api/ReferenceAble';

/**
 * Xcap category api constants and methods.
 *
 * @since 3 apr 2017
 */

export const References = {
  BLOGEDITOR: 'BlogEditor'
};

export type Context = string; // Context name, for example "news"
export type Reference = 'BlogEditor' | string; // Name of the redux store for the current Category-group (ex. "BlogEditor")

/**
 * Definition of a category
 */
export interface Category
  extends XcapObject,
    NameAware,
    DescriptionAware,
    PermalinkAware,
    CreatedDateAware,
    ReferenceAble {
  __type: 'net.josh.community.category.Category';
  order: number /** Sort order, if different from natural ordering */;

  /** Id of parent category */
  parentId: number;
  parentRef: Category;
  /** Id of root category in this tree */
  rootId: number;
  rootRef: Category;
  referenceCount: number;
  childCount: number;
  partOfPermalink: string /** Last part of the permalink */;
  fullName: string;
}

/**
 * Category insertion points.
 */
export enum Insertion {
  FIRST = 'FIRST',
  LAST = 'LAST',
  WITH_ORDER = 'WITH_ORDER',
  BEFORE_REFERENCE_ID = 'BEFORE_REFERENCE_ID',
  AFTER_REFERENCE_ID = 'AFTER_REFERENCE_ID',
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN'
}

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS = 'net.josh.community.category.CategoryManager';

/**
 * Component class
 */
export const COMPONENT_NAME = 'category';

export interface GetCategoryResult extends XcapJsonResult {
  category: Category | null;
  branch: Array<Category>;
}

/**
 * Get a category and its branch of categories up to and including the specified category.
 *
 * @param context {string} Context name, for example "news"
 * @param categoryId {number} Category id
 * @param permaLink {string} Category permalink, for example "sport/football"
 */
export function get({
  context,
  categoryId,
  permaLink
}: {
  context: string;
  categoryId?: number;
  permaLink?: string;
}): Thunk<Promise<GetCategoryResult>> {
  if (typeof categoryId === 'undefined' && typeof permaLink === 'undefined') {
    throw Error('categoryId or permaLink must be specified');
  }
  return getJson({
    url: '/category/get',
    parameters: arguments,
    context,
    componentName: COMPONENT_NAME
  });
}

export interface GetByReferenceIdResult extends XcapJsonResult {
  referencedCategory: Category | null;
  referencedCategories: Array<Category>;
}

/**
 * List all categories referenced by an object.
 *
 * @param context {string} Context name, for example "news"
 * @param referenceId {number} Id of referencing object
 */
export function getByReferenceId({
  context,
  referenceId
}: {
  context: string;
  referenceId: number;
}): Thunk<Promise<GetByReferenceIdResult>> {
  return getJson({
    url: '/category/get-by-reference-id',
    parameters: arguments,
    context,
    componentName: COMPONENT_NAME
  });
}

export interface ListCategoriesResult extends XcapJsonResult {
  /** Non null if the category exists */
  category: Category | null;
  categories: Array<Category>;
}

/**
 * List all subcategories of a specified category.
 *
 * If no category is specified, the root categories are listed.
 *
 * @param context {string} Context name, for example "news"
 * @param categoryId {number} Category id (optional)
 * @param permaLink {string} Category permalink, for example "sport/football" (optional)
 */
export function list({
  context,
  categoryId,
  permaLink
}: {
  context: string;
  categoryId?: number;
  permaLink?: string;
}): Thunk<Promise<ListCategoriesResult>> {
  return getJson({
    url: '/category/list',
    parameters: arguments,
    context,
    componentName: COMPONENT_NAME
  });
}

/**
 * Edit/create a category.
 *
 * Requires CMS admin.
 *
 * @param context {string} Context name, for example "news"
 * @param categoryId {number} Category id (optional)
 * @param name {string}
 * @param description {string}
 * @param parentCategoryId {number} Id of parent category (optional)
 * @param sortOrder {number} Sort order (optional)
 * @returns {Promise}
 */
export function edit({
  context,
  categoryId,
  name,
  description,
  parentCategoryId,
  sortOrder
}: {
  context: string;
  categoryId?: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  sortOrder?: number;
}): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/category/edit',
    parameters: arguments,
    context,
    componentName: COMPONENT_NAME
  });
}

/**
 * Remove a category.
 *
 * Requires CMS admin.
 *
 * @param context {string} Context name, for example "news"
 * @param id {number} Category id (optional)
 */
export function remove({ context, id }: { context: string; id: number }): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/category/remove',
    parameters: arguments,
    context,
    componentName: COMPONENT_NAME
  });
}
