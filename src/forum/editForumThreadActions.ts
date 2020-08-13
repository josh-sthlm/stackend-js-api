// @flow
import * as reducer from './editForumThreadReducer';

export function editForumEntyText({ text }: { text: string }): reducer.Edit {
	// @ts-ignore
  return {
		type: reducer.actionTypes.EDIT_FORUM_ENTRY_TEXT,
		text
	};
}

export function setForumEntyText({ text }: { text: string }): reducer.Set {
  // @ts-ignore
	return {
		type: reducer.actionTypes.SET_FORUM_ENTRY_TEXT,
		text
	};
}

export function addForumEntryQuote({ quote }: { quote: string }): reducer.AddQuote {
  // @ts-ignore
	return {
		type: reducer.actionTypes.ADD_QUOTE,
		quote
	};
}
type ToggleEditForumThread = {
	forumPermalink?: string,
	editThreadId?: number,
	text: string
};
export function toggleEditForumThread({
	forumPermalink,
	editThreadId,
	text
}: ToggleEditForumThread) {
	return (dispatch: any /*, getState: any*/) => {
		dispatch({
			type: reducer.actionTypes.FORUM_THREAD_TOGGLE_EDIT,
			forumPermalink,
			editThreadId
		});
		dispatch(setForumEntyText({ text }));
	};
}
