import { LikeData, LikeDataMap } from './index';

export const UPDATE_LIKE = 'UPDATE_LIKE';
export const RECEIVE_LIKES = 'RECEIVE_LIKES';
export const CLEAR_LIKES = 'CLEAR_LIKES';

export interface LikeState {
  likes: number;
  likedByCurrentUser?: boolean;
}

export interface LikesState {
  [obfuscatedReference: string]: LikeState;
}

export type LikeActions =
  | {
      type: typeof CLEAR_LIKES;
    }
  | {
      type: typeof UPDATE_LIKE;
      obfuscatedReference: string;
      likes?: number;
      likedByCurrentUser?: boolean;
    }
  | {
      type: typeof RECEIVE_LIKES;
      likes?: LikeDataMap;
    };

export function Likes(state: LikesState = {}, action: LikeActions): LikesState {
  switch (action.type) {
    case CLEAR_LIKES:
      return {};

    // like / unlike
    case UPDATE_LIKE: {
      return updateLike(Object.assign({}, state), action.obfuscatedReference, action.likes, action.likedByCurrentUser);
    }

    case RECEIVE_LIKES: {
      if (action.likes) {
        const x = Object.assign({}, state);
        Object.keys(action.likes).forEach(oRef => {
          const v: LikeData = (action.likes as LikeDataMap)[oRef]; // Stupid compiler
          updateLike(x, oRef, v.likes, v.likedByCurrentUser);
        });
        return x;
      }
    }
  }

  return state;
}

function updateLike(s: LikesState, oRef: string, likes?: number, likedByCurrentUser?: boolean): LikesState {
  let v: LikeState = s[oRef];
  if (!v) {
    v = {
      likes: typeof likes === 'number' ? likes : likedByCurrentUser ? 1 : 0
    };
  }

  if (typeof likes === 'number') {
    v.likes = likes;
  }

  if (likedByCurrentUser) {
    v.likedByCurrentUser = true;
  } else {
    delete v.likedByCurrentUser;
  }

  if (v.likes == 0 && typeof v.likedByCurrentUser === 'undefined') {
    delete s[oRef];
  } else {
    s[oRef] = v;
  }

  return s;
}

export default Likes;
