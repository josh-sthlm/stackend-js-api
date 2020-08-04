//@flow
import { find } from 'lodash/collection';
import _ from 'lodash/object';

const ALL = { key: 'all', value: null };
//const FAQ = { key: 'faq', value: 'FAQs' };
const QUESTION = { key: 'question', value: 'Questions' };
const ARTICLE = { key: 'article', value: 'Posts' };
const BLOG = { key: 'blog-article', value: 'Blogs' };
const GROUP = { key: 'group', value: 'Groups' };
const USER = { key: 'user', value: 'Users' };

const TITLES = {
	ALL,
	//FAQ,
	QUESTION,
	ARTICLE,
	BLOG,
	GROUP,
	USER
};

export function findSearchTitle(searchKey) {
	const title = find(TITLES, item => searchKey === item.key);
	return _.get(title, 'value', undefined);
}
