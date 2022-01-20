import * as reducer from './blogReducer';
import { AuthBlog, Blog, getBlog, GetBlogParams, GetBlogResult } from './index';
import { BlogActions, BlogState } from './blogReducer';
import { Thunk } from '../api';
import { AuthObject } from '../user/privileges';

export function receiveBlogs({
  entries,
  authBlogs,
  authObjects
}: {
  entries: Array<Blog>;
  authBlogs?: Array<AuthBlog>;
  authObjects?: { [blogId: number]: AuthObject };
}): BlogActions {
  return {
    type: reducer.RECEIVE_BLOGS,
    entries,
    authBlogs,
    authObjects
  };
}

export function requestBlogs(): BlogActions {
  return { type: reducer.REQUEST_BLOGS };
}

export function invalidateBlogs(): BlogActions {
  return { type: reducer.INVALIDATE_BLOGS };
}

export function clearBlogs(): BlogActions {
  return { type: reducer.CLEAR_BLOGS };
}

/**
 * Fetch a Blog and AuthBlog given id or blogKey
 * @param params
 */
export function fetchBlog(params: GetBlogParams): Thunk<Promise<GetBlogResult>> {
  return async (dispatch: any): Promise<GetBlogResult> => {
    const r = await dispatch(getBlog(params));
    if (!r.error && r.blog) {
      dispatch(receiveBlogs({ entries: r.blog ? [r.blog] : [], authBlogs: r.authBlog ? [r.authBlog] : undefined }));
    }
    return r;
  };
}

/**
 * Get a blog id given its permalink / blogKey
 * @param state
 * @param blogKey
 */
export function getBlogIdFromStore(state: BlogState, blogKey: string): number {
  return state.idByPermalink[blogKey] || 0;
}

/**
 * Get a blog from store given its id
 * @param state
 * @param blogId
 */
export function getBlogById(state: BlogState, blogId: number): Blog | null {
  return state.blogs[blogId] || null;
}

/**
 * Get a blog from store given its permalink / blogKey
 * @param state
 * @param blogKey
 */
export function getBlogByPermalink(state: BlogState, blogKey: string): Blog | null {
  const id = getBlogIdFromStore(state, blogKey);
  return !id ? null : state.blogs[id] || null;
}

/**
 * Get a blog Auth from store given its id
 * @param state
 * @param blogId
 */
export function getBlogAuthById(state: BlogState, blogId: number): AuthObject | null {
  return state.auth[blogId] || null;
}

/**
 * Get a blog Auth from store given its permalink
 * @param state
 * @param blogKey
 */
export function getBlogAuthByPermalink(state: BlogState, blogKey: string): AuthObject | null {
  const id = getBlogIdFromStore(state, blogKey);
  return !id ? null : state.auth[id] || null;
}
