import * as reducer from './blogReducer';
import { Blog } from './index';
import { BlogActions } from './blogReducer';

export function receiveBlogs({ entries }: { entries: Array<Blog> }): BlogActions {
  return {
    type: reducer.RECEIVE_BLOGS,
    entries
  };
}

export function requestBlogs(): BlogActions {
  return { type: reducer.REQUEST_BLOGS };
}

export function invalidateBlogs(): BlogActions {
  return { type: reducer.INVALIDATE_BLOGS };
}
