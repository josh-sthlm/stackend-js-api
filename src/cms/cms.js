//@flow
import {
	COMMUNITY_PARAMETER,
	getJson,
	post,
	type XcapJsonResult,
	type ModerationStatusIds
} from '../api.ts';
import { generatePermalink } from '../permalink.ts';
import { type Thunk } from '../store.ts';
import { type User } from '../user/user.ts';
import { type PaginatedCollection } from '../PaginatedCollection.ts';
import { type Category } from '../category/category.js';
import { type InsertionType } from '../category/category.js';
import { type Order } from '../search/search.js';
import { type Tree, type Node, newTree, newTreeNode } from '../tree/tree.js';
import { ModuleType } from '../stackend/modules.js';
import React from 'react';

/**
 * Xcap Cms api constants and methods.
 * @author jens
 * @since 6 feb 2017
 */

/**
 * Css Class for elements containing rich content
 * @type {string}
 */
export const RICH_CONTENT_CSS_CLASS: string = 'stackend-rich-content';

/**
 * A content object
 */
export type Content = {
	id: number,
	permalink: string,
	name: string,
	body: string,
	publishDate?: any,
	modStatus: number,
	ttl: number,
	creatorUserId: number,
	creatorUserRef?: User,
	createdDate: any,
	modifiedDate?: any,
	modifiedByUserId: number,
	modifiedByUserRef?: User
};

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS: string = 'se.josh.xcap.cms.CmsManager';

/**
 * Component name
 */
export const COMPONENT_NAME: string = 'cms';

/**
 * Default context
 * @type {string}
 */
export const DEFAULT_CMS_CONTEXT: string = 'cms';

export type GetContentResult = XcapJsonResult & {
	content: ?Content
};

/**
 * Get CMS content
 * @param id Content id (required)
 * @param permalink Content permalink (optional)
 */
export function getContent({
	id,
	permalink
}: {
	id?: number,
	permalink?: string
}): Thunk<GetContentResult> {
	return getJson({ url: '/cms/get', parameters: arguments });
}

export type PopulateTemplateContent = XcapJsonResult & {
	result: ?string
};

/**
 * Get CMS content, populate template values.
 * Any extra parameters passed down are used
 * @param id Content id (required)
 * @param permalink Content permalink (optional)
 */
export function populateTemplateContent({
	id,
	permalink
}: {
	id?: number,
	permalink?: string
}): Thunk<PopulateTemplateContent> {
	return getJson({ url: '/cms/populate-template', parameters: arguments });
}

export type ListContentResult = XcapJsonResult & {
	contentPaginated: PaginatedCollection<Content>,
	isPage: boolean,
	childCategories: Array<Category>
};

/**
 * List CMS content by category/permalink.
 * @param permalink Content category permalink (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listContent({
	permalink,
	p = 1,
	pageSize
}: {
	permalink?: string,
	p?: number,
	pageSize?: number
}): Thunk<ListContentResult> {
	return getJson({
		url: '/cms/list',
		parameters: {
			permalink,
			getPermalinkFromUrl: false,
			p,
			pageSize
		}
	});
}

export type SearchResult = XcapJsonResult & {
	results: PaginatedCollection<Content>
};

/**
 * Search CMS content
 * @param q Search expression
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @param orderBy Order by (optional)
 */
export function search({
	q,
	p = 1,
	pageSize,
	orderBy
}: {
	q?: string,
	p?: number,
	pageSize?: number,
	orderBy?: 'CREATED' | 'MODIFIED' | 'SORT'
}): Thunk<SearchResult> {
	return getJson({
		url: '/cms/search',
		parameters: {
			q,
			p,
			pageSize,
			orderBy
		}
	});
}

export type Page = {
	id: number,
	parentPageId: number,
	name: string,
	permalink: string,
	/** Number of sub pages */
	childCount: number,
	/** Is the page visible? */
	enabled: boolean,
	ogImageUrl: string,
	metaDescription: string,
	content: Array<PageContent>
};

export type PageContent = {
	name: string,
	/** Simple reference type name */
	type: string,

	/** Is this content visible? */
	visible: boolean,

	/** Reference in string format */
	reference: string,

	/** Referenced object */
	referenceRef: any
};

export const MenuVisibility = {
	HORIZONTAL: 'HORIZONTAL',
	VERTICAL: 'VERTICAL',
	OFF: 'OFF'
};

export type MenuVisibilityIds = $Values<MenuVisibility>;

export function parseMenuVisibility(v: string): MenuVisibilityIds {
	if (!v) {
		return MenuVisibility.HORIZONTAL;
	} else if (v === 'false') {
		return MenuVisibility.OFF;
	} else if (v.toUpperCase() === MenuVisibility.VERTICAL) {
		return MenuVisibility.VERTICAL;
	}

	return MenuVisibility.HORIZONTAL;
}

export type EditContentResult = XcapJsonResult & {
	content: ?Content
};

/**
 * Edit CMS content.
 * @param id (may be 0 to create a new content object)
 * @param permalink
 * @param headline
 * @param teaser
 * @param body
 *
 * The body may be up to 65KB html.
 *
 * @returns {Promise}
 */
export function editContent({
	id,
	permalink,
	headline,
	teaser,
	body,
	categoryId
}: {
	id?: number,
	permalink?: string,
	headline?: string,
	teaser?: string,
	body: string,
	categoryId?: number
}): Thunk<EditContentResult> {
	return post({ url: '/cms/edit', parameters: arguments });
}

/**
 * Set moderation status of cms content
 * @param id
 * @param moderationStatus
 */
export function setModerationStatus({
	id,
	moderationStatus
}: {
	id: number,
	moderationStatus: ModerationStatusIds
}): Thunk<XcapJsonResult> {
	return post({ url: '/cms/set-modstatus', parameters: arguments });
}

/**
 * Remove CMS content.
 *
 * @param id Cms content id (required)
 * @returns {Promise}
 */
export function removeContent({ id }: { id: number }): Thunk<*> {
	return post({ url: '/cms/remove', parameters: arguments });
}

/**
 * Move CMS content
 * @returns {Thunk<XcapJsonResult>}
 */
export function moveContent({
	id,
	newCategoryId,
	oldCategoryId,
	insertion,
	insertionPoint
}: {
	id: number,
	newCategoryId: number,
	oldCategoryId?: number,
	insertion: InsertionType,
	insertionPoint: number
}): Thunk<*> {
	return post({
		url: '/cms/move',
		parameters: {
			referenceId: id,
			newCategoryId,
			oldCategoryId,
			insertion,
			insertionPoint
		}
	});
}

/**
 * Create a new page
 * @param name
 * @param permalink
 */
export function newPage(name: string, permalink?: string): Page {
	let pl = '/' + (permalink ? permalink : generatePermalink(name));

	return {
		id: 0,
		name,
		permalink: pl,
		enabled: true,
		metaDescription: null,
		ogImageUrl: null,
		content: []
	};
}

export type EditPageResult = XcapJsonResult & {};

/**
 * Edit a cms page
 *
 * @returns {Thunk<EditPageResult>}
 */
export function editPage({
	page,
	parentPageId
}: {
	page: Page,
	parentPageId?: number
}): Thunk<EditPageResult> {
	return post({
		url: '/cms/pages/edit',
		parameters: {
			page: JSON.stringify(page),
			parentPageId
		}
	});
}

/**
 * Remove a cms page
 * @param id
 * @returns {Thunk<XcapJsonResult>}
 */
export function removePage({ id }: { id: number }): Thunk<XcapJsonResult> {
	return post({ url: '/cms/pages/remove', parameters: arguments });
}

export type GetPageResult = XcapJsonResult & {
	page: Page
};

/**
 * List all content for a cms page.
 * @param permalink
 * @param p
 * @param pageSize
 * @returns {Thunk<GetPageResult>}
 */
export function getPage({
	id,
	permalink,
	p = 1,
	pageSize = 100
}: {
	id: number,
	permalink?: string,
	p?: number,
	pageSize?: number
}): Thunk<GetPageResult> {
	return getJson({
		url: '/cms/pages/get',
		parameters: {
			id,
			permalink,
			p,
			pageSize
		}
	});
}

/**
 * Search for pages where a content is used.
 * @param contentId
 * @param p
 * @param pageSize
 * @returns {Thunk<SearchPagesResult>}
 */
export function searchContentUse({
	contentId,
	p = 1,
	pageSize = 10
}: {
	contentId: number,
	p?: number,
	pageSize?: number
}): Thunk<SearchPagesResult> {
	return getJson({
		url: '/cms/find-uses',
		parameters: {
			contentId,
			p,
			pageSize
		}
	});
}

export type SearchPagesResult = XcapJsonResult & {
	result: PaginatedCollection<Page>
};

/*
 * Search for cms pages
 * @param q
 * @param orderBy "name" or "createdDate"
 * @param order
 * @param p
 * @param pageSize
 * @returns {Thunk<SearchPagesResult>}
 */
export function searchPages({
	q,
	p,
	pageSize,
	orderBy,
	order
}: {
	q: string,
	p: ?number,
	pageSize: ?number,
	orderBy: ?('name' | 'createdDate'),
	order: ?Order
}): Thunk<SearchPagesResult> {
	return getJson({
		url: '/cms/pages/search',
		parameters: arguments
	});
}

export type GetPagesResult = XcapJsonResult & {
	pages: { [id: string]: Page }
};

/**
 * Get multiple pages by id.
 * @param pageIds
 * @param permalinks
 * @returns {Thunk<GetPagesResult>}
 */
export function getPages({
	pageIds,
	permalinks,
	communityPermalink
}: {
	pageIds?: Array<number>,
	permalinks?: Array<string>,
	communityPermalink?: ?string
}): Thunk<GetPagesResult> {
	return getJson({
		url: '/cms/pages/get-multiple',
		parameters: {
			pageId: pageIds,
			permalink: permalinks,
			[COMMUNITY_PARAMETER]: communityPermalink
		}
	});
}

export type SearchPageContentResult = XcapJsonResult & {
	result: Map<string, Array<PageContent>>
};

/**
 * Search for page content
 * @param q
 * @returns {Thunk<SearchPageContentResult>}
 */
export function searchPageContent({
	q,
	codeBinOnly
}: {
	q: string,
	codeBinOnly: boolean
}): Thunk<SearchPageContentResult> {
	return getJson({
		url: '/cms/pages/search-page-content',
		parameters: arguments
	});
}

export type GetAvailablePagePermalinkResult = XcapJsonResult & {
	availablePermalink: string
};

/**
 * Construct an avaialable permalink for cms pages
 * @param pageId
 * @param permalink
 * @returns {Thunk<XcapJsonResult>}
 */
export function getAvailablePagePermalink({
	pageId,
	permalink
}: {
	pageId?: ?number,
	permalink: string
}): Thunk<GetAvailablePagePermalinkResult> {
	return getJson({
		url: '/cms/pages/get-available-permalink',
		parameters: arguments
	});
}

export type SubSiteNode = Node;
export type SubSite = Tree;

export type GetSubSiteResult = XcapJsonResult & {
	tree: ?SubSite,
	referencedObjects: Map<string, any>
};

export function getSubSite({ id }: { id: number }): Thunk<GetSubSiteResult> {
	return getJson({
		url: '/cms/subsite/get',
		parameters: arguments
	});
}

export function storeSubSite({ subSite }: { subSite: SubSite }): Thunk<GetSubSiteResult> {
	return post({
		url: '/cms/subsite/store',
		parameters: {
			tree: JSON.stringify(subSite)
		}
	});
}

export type RemoveSubSiteResult = XcapJsonResult & {
	removed: boolean
};

export function removeSubSite({ id }: { id: number }): Thunk<RemoveSubSiteResult> {
	return post({
		url: '/cms/subsite/remove',
		parameters: arguments
	});
}

export type SearchSubSiteResult = XcapJsonResult & {
	trees: PaginatedCollection<SubSite>
};

export function searchSubSites({
	q,
	p,
	pageSize
}: {
	q?: ?string,
	p?: ?number,
	pageSize?: ?number
}): Thunk<SearchSubSiteResult> {
	return getJson({
		url: '/cms/subsite/list',
		parameters: arguments
	});
}

/**
 * Create, but does not store a new subsite
 */
export function newSubSite(name: string): SubSite {
	return newTree(name);
}

/**
 * Create, but does not store a new subsite node
 */
export function newSubSiteNode(name: string): SubSiteNode {
	return newTreeNode(name);
}

/**
 * Get the default page (start page) id.
 * @param subSite
 * @returns {number}
 */
export function getDefaultPageId(subSite: SubSite): number {
	if (!subSite) {
		return 0;
	}

	if (subSite.referenceId) {
		return subSite.referenceId;
	}

	for (let i = 0; i < subSite.children.length; i++) {
		let c = subSite.children[i];
		if (c.referenceId) {
			return c.referenceId;
		}
	}

	return 0;
}

/**
 * Add content to the dom. Client side only
 * @param contentId
 * @param html
 * @param css
 * @param javascript
 * @param parent
 */
export function _addContentToDom(
	parent: Element,
	contentId: number,
	html: ?string,
	css: ?string,
	javascript: ?string
) {
	const document = parent.ownerDocument;
	if (parent && (html || css)) {
		const addHtml = (css ? css : '') + (html ? html : '');
		try {
			const x = document.createRange().createContextualFragment(addHtml);
			// Replace children
			while (parent.childNodes.length > 0) {
				parent.removeChild(parent.childNodes[0]);
			}
			parent.appendChild(x);
		} catch (x) {
			console.warn('Error in javascript tag: ', addHtml, ' from cms module: ', contentId);
		}
	}

	if (javascript) {
		try {
			const range = document.createRange();
			range.setStart(document.getElementsByTagName('BODY')[0], 0);
			document
				.getElementsByTagName('BODY')[0]
				.appendChild(range.createContextualFragment(javascript));
		} catch (x) {
			console.warn('Error in javascript: ', x, ' from cms module: ', contentId);
		}
	}
}

/**
 * Add content to the dom. Client side only
 * @param parent
 * @param content
 */
export function addContentToDom(parent: Element, content: Content) {
	if (!parent || !content) {
		return;
	}

	if (typeof __xcapRunningServerSide !== 'undefined') {
		throw 'addContentToDom can not be executed serverside';
	}

	const { htmlValue, javascriptValue, cssValue } = extractContentValues(content);

	let style = `<style type="text/css">${cssValue}</style>`;
	let javascript = '';
	if (javascriptValue !== '') {
		javascript = `<script type="text/javascript" id="stackend-cms-js-${content.id}">${javascriptValue}</script>`;
	}
	let html = style + `<div class='${RICH_CONTENT_CSS_CLASS}'>${htmlValue}</div>`;

	_addContentToDom(parent, content.id, html, '', javascript);
}

/**
 * Remove all child nodes of an element
 * @param element
 */
export function removeAllChildNodes(element: any) {
	while (element.childNodes.length > 0) {
		element.removeChild(element.childNodes[0]);
	}
}

/**
 * Construct a composite content value
 * @param html
 * @param css
 * @param js
 */
export function createContentValue(html: string, css: string, js: string): string {
	const stringStyle = `<style type="text/css" data-stackend-cms="css">${css}</style>`;
	const stringJavascript = `<script type="text/javascript" data-stackend-cms="js">${js}</script>`;
	const stringHtml = `<div data-stackend-cms="html">${html}</div>`;

	// HTML should be the last one to not mess up the other two in case of backend tag ballancing.
	// However, javascript needs to be last for preview to work
	return `${stringStyle}${stringHtml}${stringJavascript}`;
}

/**
 * Split a content object into HTML, CSS and JS.
 * NOTE: Browser only
 * @param content
 * @returns {{htmlValue: (*|string), javascriptValue: (*|string), cssValue: (*|string)}}
 */
export function extractContentValues(
	content: ?Content
): {
	htmlValue: string,
	javascriptValue: string,
	cssValue: string
} {
	let html, javascript, css;

	if (content && content.body) {
		let xmlDoc = new DOMParser().parseFromString(content.body, 'text/html');

		css = xmlDoc.evaluate(
			'//style[@data-stackend-cms="css"]',
			xmlDoc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		javascript = xmlDoc.evaluate(
			'//script[@data-stackend-cms="js"]',
			xmlDoc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		html = xmlDoc.evaluate(
			'//div[@data-stackend-cms="html"]',
			xmlDoc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		// Fall backs to old style code

		if (css === null) {
			css = xmlDoc.evaluate(
				'/html/head/style',
				xmlDoc,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
		}

		if (html == null) {
			html = xmlDoc.evaluate(
				'/html/body/div',
				xmlDoc,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
		}

		if (javascript == null) {
			javascript = xmlDoc.evaluate(
				'/html/body/script',
				xmlDoc,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
		}
	}

	return {
		htmlValue: html ? html.innerHTML : '',
		javascriptValue: javascript ? javascript.innerHTML : '',
		cssValue: css ? css.innerHTML : ''
	};
}

export type ContentValues = {
	[id: string]: {
		html: ?string,
		javascript: ?string,
		style: ?string
	}
};

/**
 * Extract all content values from a page
 * @param page
 */
export function getContentValues(page: ?Page): ContentValues {
	if (!page) {
		return {};
	}

	let contentValues = {};

	page.content.forEach(pc => {
		if (pc.type === ModuleType.CMS && pc.referenceRef) {
			const { htmlValue, javascriptValue, cssValue } = extractContentValues(pc.referenceRef);
			let style = cssValue ? (
				<style
					type="text/css"
					dangerouslySetInnerHTML={{ __html: cssValue }}
					key={'pc-css-' + pc.referenceRef.id}
					id={'stackend-cms-' + pc.referenceRef.id + '-style'}
				/>
			) : null;
			let javascript = null;
			if (javascriptValue !== '') {
				javascript = `<script type="text/javascript" id="stackend-cms-${pc.referenceRef.id}-js">${javascriptValue}</script>`;
			}
			let html = htmlValue ? `<div class='${RICH_CONTENT_CSS_CLASS}'>${htmlValue}</div>` : null;
			contentValues[pc.reference] = {
				html,
				style,
				javascript
			};
		}
	});

	return contentValues;
}
