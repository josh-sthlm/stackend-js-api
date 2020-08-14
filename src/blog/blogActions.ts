//@flow
import * as reducer from './blogReducer';
import { Blog } from '../blog';
import { AnyAction } from 'redux';

export interface ReceiveBlogs {
  entries: Array<Blog>;
}

export function recieveBlogs({ entries }: ReceiveBlogs): AnyAction {
  return {
    type: reducer.RECIEVE_BLOGS,
    entries,
  };
}

export function requestBlogs(): AnyAction {
  return { type: reducer.REQUEST_BLOGS };
}

export function invalidateBlogs(): AnyAction {
  return { type: reducer.INVALIDATE_BLOGS };
}
