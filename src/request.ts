// @flow
import { Thunk } from './api';
import _ from 'lodash';

export interface Location {
	hash: string,
	host: string,
	hostName: string,
	href: string,
	origin: string,
	pathname: string,
	port: number,
	protocol: string,
	search: string,
	query: { [name:string]: string}
}

export enum AnchorType {
	BLOG = 'blog',
	USER = 'user',
	SITE = 'site',
	COMMENT = 'comment'
}

/**
 * An object representing the parsed part of an anchor link.
 * Used to load relevant data and for jumping to objects.
 */
export interface StackendAnchor {
	type: string,
	permalink: string,
	items?: Array<StackendAnchor>,
	reference?: any,

	// User
	userId?: number,

	// Site
	sitePermalink?: string,
	pagePermalink?: string,

	// Blog
	blogKey?: string,
	blogEntryPermalink?: string
}

/**
 * An implementation neutral object that keeps track of the current url and some extra stackend specific data
 */
export interface Request {
	location: Location,

	/** Client cookie */
	cookie: string | null,

	/** Absolute url to the node server */
	absoluteUrl: string,

	/** Path to the current community, if any */
	communityUrl: string,

	/** Absolute url to the current community, if any */
	absoluteCommunityUrl: string,

	/** The community has been determined from the domain name rather than the path */
	communityFromDomain: boolean,

	/** Context path for the node server */
	contextPath: string,

	/** Reference url id */
	referenceUrlId: number,

	anchor: StackendAnchor | null,
}

/**
 * Get the request object
 */
export function getRequest(): Thunk<any> {
	return (dispatch, getState) => {
		return _.get(getState(), 'request');
	};
}



/**
 * Construct the string version of an anchor
 * @param anchor
 * @returns {string}
 */
export function formatAnchor(anchor: StackendAnchor): string {
	if (!anchor) {
		return '';
	}

	let s = '#/' + anchor.type + '/' + anchor.permalink;

	if (anchor.items) {
		for (let i = 0; i < anchor.items.length; i++) {
			let a = anchor.items[i];
			s += ';' + a.type + '/' + a.permalink;
		}
	}

	return s;
}

/**
 * Get the element id for an anchor
 * @param anchor
 * @returns {null}
 */
export function getAnchorId(anchor: StackendAnchor): string | null {
	if (!anchor) {
		return null;
	}
	return '/' + anchor.type + '/' + anchor.permalink;
}

/**
 * Parse the stackend anchor
 * @param anchor
 * @returns {StackendAnchor|null}
 */
export function parseAnchor(anchor: string|null): StackendAnchor | null {
	if (!anchor) {
		return null;
	}

	let s = anchor.replace(/^#?\/?/, '');
	let v = s.split(';');

	if (v.length === 0) {
		return null;
	}

	let a: StackendAnchor = {
		type: '',
		permalink: '/' + s,
		items: []
	};

	for (let i = 0; i < v.length; i++) {
		let x = parseAnchorInt(v[i]);
		if (x) {
			a.items.push(x);
		}
	}

	if (a.items.length !== 0) {
		a.type = a.items[0].type;
		let i = s.indexOf('/');
		a.permalink = s.substring(i + 1);
	}

	return a;
}

function parseAnchorInt(anchor: string): StackendAnchor|null {
	if (anchor.indexOf('/') === 0) {
		anchor = anchor.substring(1);
	}

	let i = anchor.indexOf('/');
	if (i === -1) {
		return null;
	}

	let type = anchor.substring(0, i);
	let permalink = anchor.substring(i + 1);

	let a: StackendAnchor = {
		type,
		permalink
	};

	let v = permalink.split('/');

	switch (type) {
		case AnchorType.BLOG:
			// / blog/BLOGKEY/BLOGKEY/ENTRY
			if (v.length >= 2) {
				a.blogEntryPermalink = v[v.length - 1];
				v.length = v.length - 1;
				a.blogKey = v.join('/');
			}
			break;

		case AnchorType.USER:
			// user/1/1
			if (v.length === 2) {
				a.userId = parseInt(v[0]);
			}
			break;

		case AnchorType.SITE:
			// site/SITE/PAGE/PAGE
			if (v.length >= 2) {
				a.sitePermalink = v[0];
				v.shift();
				a.pagePermalink = v.join('/');
			}
			break;

		case AnchorType.COMMENT:
			// comment/REFID/ID/type/....
			if (v.length >= 2) {
				a.referenceId = v[0];
				a.id = v[1];
				v.shift();
				v.shift();
				let n = v.join('/');
				a.reference = parseAnchor(n);
			}
			break;
	}

	return a;
}

/**
 * Get a specific part of an anchor
 * @param anchor
 * @param type
 * @returns {StackendAnchor|null}
 */
export function getAnchorPart(anchor: StackendAnchor|null, type: AnchorType): StackendAnchor|null {
	if (!anchor || !type || !anchor.items) {
		return null;
	}

	let items = anchor.items;
	if (!items) {
		return null;
	}

	for (let i = 0; i < items.length; i++) {
		let x = items[i];
		if (x.type === type) {
			return x;
		}
	}

	return null;
}

/**
 * Scroll to a stackend anchor
 * @param anchor
 */
export function scrollToAnchor(anchor: StackendAnchor) {
	if (!anchor) {
		return;
	}

	let id = getAnchorId(anchor);
	if (id) {
		let e = document.getElementById(id);
		if (e) {
			console.log('Stackend: scrolling to', id);
			e.scrollIntoView();
		}
	} else {
		console.warn('Stackend: anchor', id, ' not found');
	}
}



