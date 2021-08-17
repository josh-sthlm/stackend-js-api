//@flow

import createTestStore from './setup';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import {
  clearCurrentCommunity,
  fetchCommunity,
  getObjectsRequiringModeration,
  setCurrentCommunity
} from '../src/stackend/communityAction';

describe('Stackend Actions', () => {
  const store = createTestStore();

  describe('Current community actions', () => {
    it('Get a community', async () => {
      await store.dispatch(fetchCommunity({ permalink: STACKEND_COM_COMMUNITY_PERMALINK }));

      const { communities } = store.getState();
      expect(communities.community).toBeDefined();
      expect(communities.community.permalink).toEqual(STACKEND_COM_COMMUNITY_PERMALINK);
      expect(communities.objectsRequiringModeration[55]).toBeDefined();
    });

    it('Get number of objects requiring moderation', () => {
      let communities = store.getState().communities;
      store.dispatch(setCurrentCommunity(communities.community, 123));

      communities = store.getState().communities;
      expect(getObjectsRequiringModeration(communities, -123)).toBe(0);
      expect(getObjectsRequiringModeration(communities, 55)).toBe(123);
    });

    it('Clears the current community', () => {
      store.dispatch(clearCurrentCommunity());
      const { communities } = store.getState();
      expect(communities.community).toBeNull();
      expect(communities.objectsRequiringModeration[55]).toBeUndefined();
    });
  });
});
