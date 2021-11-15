import createTestStore from './setup';

import { LikesState } from '../src/like/likeReducer';
import assert from 'assert';
import { clearLikes, getNumberOfLikes, isLikedByCurrentUser, receiveLikes, updateLike } from '../src/like/likeActions';

describe('Like', () => {
  const store = createTestStore();

  describe('Actions', () => {
    it('updateLike', () => {
      let likes: LikesState = store.getState().likes;
      assert(likes);

      store.dispatch(updateLike('abc', 1, true));
      store.dispatch(updateLike('def', 2, true));

      likes = store.getState().likes;
      expect(likes).toStrictEqual({
        abc: {
          likes: 1,
          likedByCurrentUser: true
        },
        def: {
          likes: 2,
          likedByCurrentUser: true
        }
      });

      expect(isLikedByCurrentUser(likes, 'abc')).toBe(true);
      expect(getNumberOfLikes(likes, 'abc')).toBe(1);
      expect(isLikedByCurrentUser(likes, 'def')).toBe(true);
      expect(getNumberOfLikes(likes, 'def')).toBe(2);
      expect(isLikedByCurrentUser(likes, 'NOT_LIKED')).toBe(false);
      expect(getNumberOfLikes(likes, 'NOT_LIKED')).toBe(0);

      store.dispatch(updateLike('def', 3, false));
      likes = store.getState().likes;
      expect(likes['def'].likedByCurrentUser).toBeUndefined();
      expect(isLikedByCurrentUser(likes, 'abc')).toBe(true);
      expect(isLikedByCurrentUser(likes, 'def')).toBe(false);

      store.dispatch(updateLike('abc', 5, undefined));
      store.dispatch(updateLike('def', undefined, true));
      likes = store.getState().likes;

      expect(isLikedByCurrentUser(likes, 'abc')).toBe(false);
      expect(getNumberOfLikes(likes, 'abc')).toBe(5);
      expect(isLikedByCurrentUser(likes, 'def')).toBe(true);
      expect(getNumberOfLikes(likes, 'def')).toBe(3);

      // Should remove entries with likes: 0
      store.dispatch(updateLike('abc', 0, false));
      likes = store.getState().likes;
      expect(likes['abc']).toBeUndefined();
      expect(isLikedByCurrentUser(likes, 'abc')).toBe(false);
      expect(getNumberOfLikes(likes, 'abc')).toBe(0);
    });

    it('clearLikes', () => {
      store.dispatch(updateLike('abc', 1, true));
      store.dispatch(clearLikes());
      const likes: LikesState = store.getState().likes;
      expect(likes).toStrictEqual({});
    });

    it('receiveLikes', () => {
      store.dispatch(clearLikes());
      store.dispatch(receiveLikes({}));
      let likes: LikesState = store.getState().likes;
      expect(likes).toStrictEqual({});

      store.dispatch(
        receiveLikes({
          abc: { likes: 3, likedByCurrentUser: true },
          def: { likes: 5, likedByCurrentUser: false }
        })
      );
      likes = store.getState().likes;
      expect(isLikedByCurrentUser(likes, 'abc')).toBe(true);
      expect(getNumberOfLikes(likes, 'abc')).toBe(3);
      expect(isLikedByCurrentUser(likes, 'def')).toBe(false);
      expect(getNumberOfLikes(likes, 'def')).toBe(5);
    });
  });
});
