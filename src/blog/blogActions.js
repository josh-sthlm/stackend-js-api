//@flow
import * as blogApi from './blog.js';
import * as reducer from './blogReducer.js';

type RecieveBlogs = {
	entries: Array<blogApi.Blog>
};

export function recieveBlogs({ entries }: RecieveBlogs) {
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
