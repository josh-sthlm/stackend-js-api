import blogs from '../blog/blogReducer';
import groupBlogEntries from '../blog/groupBlogEntriesReducer';
import categories from '../category/categoryReducer';
import references from './referenceReducer';
import request from '../request/requestReducers';
import config from './configReducer';
import cmsContent from '../cms/cmsReducer';
import pages from '../cms/pageReducer';
import editForumThread from '../forum/editForumThreadReducer';
import { forumThreads } from '../forum/forumThreadReducer';
import groups from '../group/groupReducer';
import currentUser from '../login/loginReducer';
import qna from '../qna/qnaReducer';
import search from '../search/searchReducer';
import shop from '../shop/shopReducer';
import communities from '../stackend/communityReducer';
import modules from '../stackend/moduleReducer';
import vote from '../vote/voteReducer';
import GroupComments from '../comments/commentReducer';
import throbber from '../throbber/throbberReducer';
import { Reducer } from 'redux';
import likes from '../like/likeReducer';
import events from '../event/eventReducer';
import polls from '../poll/pollReducer';
import users from '../user/usersReducer';
import forums from '../forum/forumReducer';

/**
 * Minimum set of reducers with their expected names
 */
export const BASE_REDUCERS: { [name: string]: Reducer<any, any> } = {
  config,
  currentUser,
  references,
  request,
  communities,
  modules,
  throbber
};

/**
 * All Stackend reducers and their expected names.
 */
export const STANDARD_REDUCERS: { [name: string]: Reducer<any, any> } = {
  ...BASE_REDUCERS,

  // Blog
  blogs,
  groupBlogEntries,

  categories,

  // CMS
  cmsContent,
  pages,

  GroupComments,

  // Forum
  forums,
  forumThreads,
  editForumThread,

  groups,
  qna,
  search,
  shop,
  vote,
  likes,
  events,
  polls,
  users
};
