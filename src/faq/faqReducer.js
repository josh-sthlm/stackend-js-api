// @flow
import update from 'immutability-helper';
import { find } from 'lodash/collection';

export const RECIEVE_FAQ_SECTIONS: string = 'RECIEVE_FAQ_SECTIONS';
export const RECIEVE_FAQ_ARTICLES: string = 'RECIEVE_FAQ_ARTICLES';
export const RECIEVE_FAQ_ARTICLE: string = 'RECIEVE_FAQ_ARTICLE';
export const RECIEVE_FAQ_SEARCH: string = 'RECIEVE_FAQ_SEARCH';

export default function faq(state: any = [], action: any) {
	let indexOfRecievedSection;
	switch (action.type) {
		case RECIEVE_FAQ_SECTIONS:
			if (state.length === 0) {
				if (!!action.sections) {
					return update(state, { $push: action.sections });
				}
				return state;
			} else {
				const newState = action.sections.map((section, id) => {
					const indexOfRecievedSection = state
						.map(actionSection => actionSection.id)
						.indexOf(section.id);
					/*We need to merge state in order to keep articleObjects for received sections*/
					if (state[indexOfRecievedSection]) {
						return update(state[indexOfRecievedSection], {
							$merge: find(action.sections, { id: state[indexOfRecievedSection].id })
						});
					} else {
						return section;
					}
				});
				return update(state, { $set: newState });
			}

		case RECIEVE_FAQ_ARTICLES:
			indexOfRecievedSection = state
				.map(section => parseInt(section.id))
				.indexOf(parseInt(action.sectionId));
			if (indexOfRecievedSection === -1) {
				return update(state, {
					[state.length]: {
						$set: {
							id: action.articles[0].sectionId,
							articleObjects: action.articles
						}
					}
				});
			}
			return update(state, {
				[indexOfRecievedSection]: {
					articleObjects: {
						$apply: articleObjects => update(articleObjects || [], { $merge: action.articles })
					}
				}
			});

		case RECIEVE_FAQ_ARTICLE:
			indexOfRecievedSection = state.map(section => section.id).indexOf(action.sectionId);
			if (indexOfRecievedSection === -1) {
				state = [
					{
						id: action.article.sectionId,
						articleObjects: [action.article]
					}
				];
				indexOfRecievedSection = 0;
			}
			let indexOfRecievedArticle = -1;
			indexOfRecievedArticle =
				!!state[indexOfRecievedSection].articleObjects &&
				state[indexOfRecievedSection].articleObjects
					.map(article => article.id)
					.indexOf(action.articleId);
			if (indexOfRecievedArticle === -1 || indexOfRecievedArticle === false) {
				if (!!state[indexOfRecievedSection]) {
					state = update(state, {
						[indexOfRecievedSection]: {
							$merge: {
								id: action.article.sectionId,
								articleObjects: [action.article]
							}
						}
					});
				} else {
					state = [
						{
							id: action.article.sectionId,
							articleObjects: [action.article]
						}
					];
				}
				indexOfRecievedArticle = 0;
			}
			if (!state[indexOfRecievedSection].articleObjects) {
				state[indexOfRecievedSection].articleObjects = [];
			}
			return update(state, {
				[indexOfRecievedSection]: {
					articleObjects: {
						[indexOfRecievedArticle]: { $merge: action.article }
					}
				}
			});

		default:
			return state;
	}
}
