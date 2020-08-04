//@flow


import blogs from "./blog/blogReducer.js";
import groupBlogEntries from "./blog/groupBlogEntriesReducer.js";
import categories from "./category/categoryReducer.js";
import references from "./referenceReducer.js";
import request  from "./requestReducers.js";
import config from './configReducer.js';
import cms from './cms/cmsReducer.js';
import pages from './cms/pageReducer.js';
import comments from './comments/commentReducer.js';
import editForumThread from "./forum/editForumThreadReducer.js";
import forums from "./forum/forumReducer.js";
import forumThreads from "./forum/forumThreadReducer.js";
import groups from "./group/groupReducer.js";
import currentUser from './login/loginReducer.js';
import qna from "./qna/qnaReducer.js";
import search from "./search/searchReducer.js";
import shop from "./shop/shopReducer.js";
import communities from "./stackend/communityReducer.js";
import modules from "./stackend/moduleReducer.js";
import vote from "./vote/voteReducer.js";


/**
 * Minimum set of reducers with their expected names
 */
export const BASE_REDUCERS: Map<string,function> = {
    config,
    currentUser,
    references,
    request,
    communities,
    modules,
};


/**
 * All Stackend reducers and their expected names.
 */
export const ALL_REDUCERS: Map<string,function> = {
    ...BASE_REDUCERS,

    // Blog
    blogs,
    groupBlogEntries,

    categories,

    // CMS
    cms,
    pages,

    comments,

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

