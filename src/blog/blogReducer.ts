// @flow
import update from 'immutability-helper';

import { Blog } from '../blog';


export const REQUEST_BLOGS = 'REQUEST_BLOGS';
export const RECIEVE_BLOGS = 'RECIEVE_BLOGS';
export const INVALIDATE_BLOGS = 'INVALIDATE_BLOGS';

export interface State {
  isFetching: boolean,
  didInvalidate: boolean,
  lastUpdated: number,
  entries: { [blogId: number]: Blog } //entries is an object with blogId: blog
}


export type Action =
  | { type: 'REQUEST_BLOGS' }
  | { type: 'RECIEVE_BLOGS', entries: Array<Blog> }
  | { type: 'INVALIDATE_BLOGS' };

export default function blogs(state: State = {
  isFetching: false,
  didInvalidate: false,
  entries: {},
  lastUpdated: Date.now()
}, action: Action) {
  switch (action.type) {
    case REQUEST_BLOGS:
      return update(state, {
        isFetching: { $set: true },
        didInvalidate: { $set: false }
      });
    case RECIEVE_BLOGS:
      let newBlogs:{[id:number]: Blog} = {};
        ((action.entries) as Array<Blog>).map(group => (newBlogs[group.id] = group));

      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        entries: { $merge: newBlogs }
      });
    case INVALIDATE_BLOGS:
      return update(state, {
        didInvalidate: { $set: true }
      });
    default:
      return state;
  }
}
