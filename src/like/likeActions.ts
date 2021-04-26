import { CONTEXT, LikeResult, like as _like, removeLike as _removeLike, LikeDataMap } from './index';
import { Thunk } from '../api';
import { UPDATE_LIKE, CLEAR_LIKES, RECEIVE_LIKES, LikesState } from './likeReducer';

/**
 * Like or remove a like from an object.
 *
 * Supply one of the parameters reference or obfuscatedReference.
 *
 * The new number of likes will be returned.
 */
export function like({
  obfuscatedReference,
  reference,
  context = CONTEXT
}: {
  obfuscatedReference?: string;
  reference?: string;
  context?: string;
}): Thunk<Promise<LikeResult>> {
  return async (dispatch: any): Promise<LikeResult> => {
    const r = await dispatch(_like({ obfuscatedReference, reference, context }));
    if (!r.error) {
      dispatch(updateLike(r.obfuscatedReference, r.numberOfLikes, true));
    }
    return r;
  };
}

/**
 * Remove a like from an object.
 *
 * Supply one of the parameters reference or obfuscatedReference.
 *
 * The new number of likes will be returned.
 *
 */
export function removeLike({
  obfuscatedReference,
  reference,
  context = CONTEXT
}: {
  obfuscatedReference?: string;
  reference?: string;
  context: string;
}): Thunk<Promise<LikeResult>> {
  return async (dispatch: any): Promise<LikeResult> => {
    const r = await dispatch(_removeLike({ obfuscatedReference, reference, context }));
    if (!r.error) {
      dispatch(updateLike(r.obfuscatedReference, r.numberOfLikes, false));
    }
    return r;
  };
}

/**
 * Clear all likes in the redux store
 */
export function clearLikes(): Thunk<void> {
  return (dispatch: any): Thunk<void> =>
    dispatch({
      type: CLEAR_LIKES
    });
}

/**
 * Update a like in the redux store
 * @param obfuscatedReference
 * @param likes: number of likes
 * @param likedByCurrentUser
 */
export function updateLike(
  obfuscatedReference: string,
  likes: number | undefined,
  likedByCurrentUser: boolean | undefined
): Thunk<void> {
  return (dispatch: any): Thunk<void> =>
    dispatch({
      type: UPDATE_LIKE,
      obfuscatedReference,
      likedByCurrentUser,
      likes
    });
}

/**
 * Update the redux store with received likes
 * @param likeDataMap
 */
export function receiveLikes(likeDataMap: LikeDataMap | undefined): Thunk<void> {
  return (dispatch: any): Thunk<void> =>
    dispatch({
      type: RECEIVE_LIKES,
      likes: likeDataMap
    });
}

/**
 * Get the number of likes for an object
 * @param likes
 * @param obfuscatedReference
 */
export function getNumberOfLikes(likes: LikesState, obfuscatedReference: string): number {
  const x = likes[obfuscatedReference];
  return x ? x.likes : 0;
}

/**
 * Check if an object is liked by the current user
 * @param likes
 * @param obfuscatedReference
 */
export function isLikedByCurrentUser(likes: LikesState, obfuscatedReference: string): boolean {
  return likes[obfuscatedReference]?.likedByCurrentUser === true;
}
