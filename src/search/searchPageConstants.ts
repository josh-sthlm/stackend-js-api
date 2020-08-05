//@flow
import _ from 'lodash';

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

export function findSearchTitle(searchKey:string) {
	const title = _.find(TITLES, item => searchKey === item.key);
	return _.get(title, 'value', undefined);
}
