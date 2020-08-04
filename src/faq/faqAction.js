// @flow
import * as faqApi from './faq.js';
import { RECIEVE_FAQ_SECTIONS, RECIEVE_FAQ_ARTICLES, RECIEVE_FAQ_ARTICLE } from './faqReducer.js';
import { includes, reject } from 'lodash/collection';

type GetSections = {
	gameId: number,
	lang: string,
	country: string,
	isCastleBlack: boolean
};

export function getSections({
	gameId,
	lang = 'en',
	country = 'UK',
	isCastleBlack = false
}: GetSections) {
	return async (dispatch: any, getState: any) => {
		try {
			let sections = await dispatch(faqApi.getSections({ gameId, lang, country }));

			if (!!sections.error) {
				console.error("Couldn't load faq sections: ", sections);
				return sections;
			}
			if (isCastleBlack) {
				sections = reject(sections, function(o) {
					return includes(
						[201865369, 201866989, 201923055, 115000437649, 201926755, 115001352225, 201932995],
						o.id
					);
				});
			}

			return dispatch(_recieveSections({ sections }));
		} catch (e) {
			console.error('Failed to get faq sections', e);
			return null;
		}
	};
}

function _recieveSections({ sections }) {
	return {
		type: RECIEVE_FAQ_SECTIONS,
		sections
	};
}

type GetArticles = GetSections & {
	sectionId: number
};

export function getArticles({ gameId, sectionId, lang = 'en', country = 'UK' }: GetArticles) {
	return async (dispatch: any, getState: any) => {
		try {
			const articles = await dispatch(faqApi.getArticles({ gameId, sectionId, lang, country }));
			return dispatch(_recieveArticles({ articles, sectionId }));
		} catch (e) {
			console.error('Failed to get faq articles', e);
			return null;
		}
	};
}

function _recieveArticles({ articles, sectionId }) {
	return {
		type: RECIEVE_FAQ_ARTICLES,
		articles,
		sectionId
	};
}

type GetArticle = GetArticles & {
	articleId: number
};

export function getArticle({
	gameId,
	sectionId,
	articleId,
	lang = 'en',
	country = 'UK'
}: GetArticle) {
	return async (dispatch: any, getState: any) => {
		try {
			const article = await dispatch(
				faqApi.getArticle({ gameId, sectionId, articleId, lang, country })
			);
			return dispatch(_recieveArticle({ article, sectionId, articleId }));
		} catch (e) {
			console.error('Failed to get faq article', e);
			return null;
		}
	};
}

function _recieveArticle({ article, sectionId, articleId }) {
	return {
		type: RECIEVE_FAQ_ARTICLE,
		article,
		sectionId,
		articleId
	};
}
