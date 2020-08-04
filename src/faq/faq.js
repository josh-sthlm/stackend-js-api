// @flow
import {
	type Config,
	createCommunityUrl,
	getJsonOutsideApi,
	_getServer,
	_getContextPath
} from '../xcap/api.js';
import zendeskFaqGameIds from './zendeskFaqGameId.js';
import { type Request } from '../request.js';
import type { Thunk } from '../types/store.js';

function getZendeskApiPath({
	config,
	gameId,
	sectionId,
	articleId,
	search
}: {
	config: Config,
	gameId: number,
	sectionId?: number,
	articleId?: number,
	search?: any
}): string {
	let cp = _getServer(config) + _getContextPath(config);
	if (!!search) {
		return `${cp}/zendesk/api/help/games/${gameId}/search`;
	} else if (!!articleId && !!sectionId && !!gameId) {
		return `${cp}/zendesk/api/help/games/${gameId}/sections/${sectionId}/articles/${articleId}`;
	} else if (!!sectionId && !!gameId) {
		return `${cp}/zendesk/api/help/games/${gameId}/sections/${sectionId}/articles`;
	} else if (!!gameId) {
		return `${cp}/zendesk/api/help/games/${gameId}/sections`;
	}
	throw 'Required parameters not supplied';
}

export function getFaqGameId({
	gameShortName,
	gameName
}: {
	gameShortName?: string,
	gameName?: string
}): number {
	const gameId = zendeskFaqGameIds
		.map((gameNameList, id) => {
			if (
				gameNameList.filter(
					zendeskGameName => zendeskGameName === gameShortName || zendeskGameName === gameName
				).length > 0
			) {
				return id;
			}
		})
		.filter(id => id !== undefined);
	if (gameId.length === 1) {
		return gameId[0];
	} else if (gameId.length > 1) {
		throw 'Current game name is not unique in zendesk, found the following:' + gameId;
	} else {
		throw "Couldn't find current game name in zendesk";
	}
}

export type Section = {
	id: number,
	name: string,
	link: string, //link to api for sections
	articles: string //link to api to get articles in the current node
};

export type Article = {
	id: number,
	name: string,
	content: string, //body text
	sectionId: number, //parent section
	brandId: number,
	link: string //link to api for sections
};

export function getFaqUrl({
	request,
	section,
	article
}: {
	request: Request,
	section?: string,
	article?: string
}): string {
	let url = '/support/faqs';

	if (!!section) {
		url += '/' + section;
	}
	if (!!article && !!section) {
		url += '/' + article;
	}
	return createCommunityUrl({
		request,
		path: url
	});
}

export function getSections({
	gameId,
	lang = 'en',
	country = 'UK'
}: {
	gameId: number,
	lang?: string,
	country?: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		const { config } = getState();
		return await dispatch(
			getJsonOutsideApi({
				url: getZendeskApiPath({ config, gameId }),
				parameters: { lang, country }
			})
		);
	};
}

export function getArticles({
	gameId,
	sectionId,
	lang = 'en',
	country = 'UK'
}: {
	gameId: number,
	sectionId?: number,
	lang?: string,
	country?: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		const { config } = getState();
		return await dispatch(
			getJsonOutsideApi({
				url: getZendeskApiPath({ config, gameId, sectionId }),
				parameters: { lang, country }
			})
		);
	};
}

export function getArticle({
	gameId,
	sectionId,
	articleId,
	lang = 'en',
	country = 'UK'
}: {
	gameId: number,
	sectionId?: number,
	articleId?: number,
	lang?: string,
	country?: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		const { config } = getState();
		return await dispatch(
			getJsonOutsideApi({
				url: getZendeskApiPath({ config, gameId, sectionId, articleId }),
				parameters: { lang, country }
			})
		);
	};
}

type Search = {
	gameId: number, //zendesk id of the game
	searchQuery: string, //search string
	lang?: string, //lang-code
	country?: string //country-code
};
export function search({ gameId, searchQuery, lang = 'en', country = 'UK' }: Search): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		const { config } = getState();
		//FIXME: this needs to send search-query as an argument..
		const searchParams = {
			'search-query': searchQuery,
			lang,
			country
		};
		return await dispatch(
			getJsonOutsideApi({
				url: getZendeskApiPath({ config, gameId, search: true }),
				parameters: searchParams
			})
		);
	};
}
