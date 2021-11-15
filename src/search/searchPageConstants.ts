import get from 'lodash/get';
import find from 'lodash/find';

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

export function findSearchTitle(searchKey: string): string | null | undefined {
  const title = find(TITLES, item => searchKey === item.key);
  return get(title, 'value', undefined);
}
