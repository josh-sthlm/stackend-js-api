//@flow


import blogs from "./blog/blogReducer";
import groupBlogEntries from "./blog/groupBlogEntriesReducer";
import categories from "./category/categoryReducer";
import references from "./referenceReducer";
import request  from "./request/requestReducers";
import config from './configReducer';
import cms from './cms/cmsReducer';
import pages from './cms/pageReducer';
import editForumThread from "./forum/editForumThreadReducer";
import forums from "./forum/forumReducer";
import forumThreads from "./forum/forumThreadReducer";
import groups from "./group/groupReducer";
import currentUser from './login/loginReducer';
import qna from "./qna/qnaReducer";
import search from "./search/searchReducer";
import shop from "./shop/shopReducer";
import communities from "./stackend/communityReducer";
import modules from "./stackend/moduleReducer";
import vote from "./vote/voteReducer";
import GroupComments from "./comments/commentReducer";
import throbber from "./throbber/throbberReducer";


/**
 * Minimum set of reducers with their expected names
 */
export const BASE_REDUCERS = {
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
export const ALL_REDUCERS = {
    ...BASE_REDUCERS,

    // Blog
    blogs,
    groupBlogEntries,

    categories,

    // CMS
    cms,
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
};

