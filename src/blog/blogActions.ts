//@flow
import * as reducer from './blogReducer';
import { Blog } from '../blog'

export interface ReceiveBlogs {
  entries: Array<Blog>
}

export function recieveBlogs({ entries }: ReceiveBlogs) {
  return {
    type: reducer.RECIEVE_BLOGS,
    entries
  };
}

export function requestBlogs() {
  return { type: reducer.REQUEST_BLOGS };
}

export function invalidateBlogs() {
  return { type: reducer.INVALIDATE_BLOGS };
}

