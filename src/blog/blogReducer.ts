// @flow
import update from 'immutability-helper';

import { AuthBlog, Blog } from './index';
import { AuthObject } from '../user/privileges';

export const REQUEST_BLOGS = 'REQUEST_BLOGS';
export const RECEIVE_BLOGS = 'RECEIVE_BLOGS';
export const INVALIDATE_BLOGS = 'INVALIDATE_BLOGS';
export const CLEAR_BLOGS = 'CLEAR_BLOGS';

export interface BlogState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;

  /**
   * Blogs
   */
  blogs: { [blogId: number]: Blog }; //entries is an object with blogId: blog

  /**
   * Blog id by permalink / blogKey
   */
  idByPermalink: { [blogKey: string]: number };

  /**
   * AuthObject by blog id
   */
  auth: { [blogId: number]: AuthObject };
}

export type BlogActions =
  | { type: typeof REQUEST_BLOGS }
  | {
      type: typeof RECEIVE_BLOGS;
      entries: Array<Blog>;
      authBlogs?: Array<AuthBlog>;
      authObjects?: { [blogId: number]: AuthObject };
    }
  | { type: typeof INVALIDATE_BLOGS }
  | { type: typeof CLEAR_BLOGS };

export default function blogs(
  state: BlogState = {
    isFetching: false,
    didInvalidate: false,
    blogs: {},
    idByPermalink: {},
    auth: {},
    lastUpdated: Date.now()
  },
  action: BlogActions
): BlogState {
  switch (action.type) {
    case REQUEST_BLOGS:
      return update(state, {
        isFetching: { $set: true },
        didInvalidate: { $set: false }
      });

    case RECEIVE_BLOGS: {
      const newBlogs: { [id: number]: Blog } = {};
      const newIdByPermalink: { [blogKey: string]: number } = {};
      action.entries.map(b => {
        newBlogs[b.id] = b;
        newIdByPermalink[b.permalink] = b.id;
      });

      const newAuth: { [id: number]: AuthObject } = {};
      if (action.authBlogs) {
        action.authBlogs.map((ab: AuthBlog) => (newAuth[ab.id] = ab.auth));
      }

      if (action.authObjects) {
        Object.keys(action.authObjects).forEach((blogId: any) => {
          const a = (action.authObjects as any)[blogId];
          newAuth[blogId] = a;
        });
      }

      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        blogs: { $merge: newBlogs },
        idByPermalink: { $merge: newIdByPermalink },
        auth: { $merge: newAuth }
      });
    }

    case INVALIDATE_BLOGS:
      return update(state, {
        didInvalidate: { $set: true }
      });

    case CLEAR_BLOGS:
      return {
        isFetching: false,
        didInvalidate: false,
        blogs: {},
        idByPermalink: {},
        auth: {},
        lastUpdated: Date.now()
      };

    default:
      return state;
  }
}
