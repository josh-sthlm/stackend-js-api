// @flow
import update from 'immutability-helper';

import { Blog } from '../blog';

export const REQUEST_BLOGS = 'REQUEST_BLOGS';
export const RECEIVE_BLOGS = 'RECEIVE_BLOGS';
export const INVALIDATE_BLOGS = 'INVALIDATE_BLOGS';

export interface BlogState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;
  entries: { [blogId: number]: Blog }; //entries is an object with blogId: blog
}

export type BlogActions =
  | { type: typeof REQUEST_BLOGS }
  | { type: typeof RECEIVE_BLOGS; entries: Array<Blog> }
  | { type: typeof INVALIDATE_BLOGS };

export default function blogs(
  state: BlogState = {
    isFetching: false,
    didInvalidate: false,
    entries: {},
    lastUpdated: Date.now(),
  },
  action: BlogActions
): BlogState {
  switch (action.type) {
    case REQUEST_BLOGS:
      return update(state, {
        isFetching: { $set: true },
        didInvalidate: { $set: false },
      });

    case RECEIVE_BLOGS: {
      const newBlogs: { [id: number]: Blog } = {};
      action.entries.map(group => (newBlogs[group.id] = group));

      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        entries: { $merge: newBlogs },
      });
    }

    case INVALIDATE_BLOGS:
      return update(state, {
        didInvalidate: { $set: true },
      });

    default:
      return state;
  }
}
