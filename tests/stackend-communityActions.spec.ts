import createTestStore from './setup';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import {
  clearCurrentCommunity,
  fetchCommunity,
  getObjectsRequiringModeration,
  receiveCommunities,
  setCurrentCommunity
} from '../src/stackend/communityAction';
import CommunityMock from './CommunutyMock';
import { CommunityState } from '../src/stackend/communityReducer';

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

    it('Set current community', () => {
      // Should not crash
      store.dispatch(setCurrentCommunity(undefined as any, 666));
      const { communities } = store.getState();
      expect(communities.community).toBeNull();
    });

    it('receiveCommunities/setCurrentCommunity', () => {
      const c1 = CommunityMock();
      store.dispatch(
        receiveCommunities({
          results: {
            pageSize: 10,
            page: 1,
            entries: [c1]
          }
        })
      );
      let communities: CommunityState = store.getState().communities;
      expect(communities?.communities?.entries[0]?.name).toBe(c1.name);

      // Ensures that setCurrentCommunity updates the other communities as well
      const c1Mod = Object.assign(c1, {
        name: 'new name'
      });
      store.dispatch(setCurrentCommunity(c1Mod));
      communities = store.getState().communities;
      expect(communities?.community?.name).toBe('new name');
      expect(communities?.communities?.entries[0]?.name).toBe('new name');

      store.dispatch(setCurrentCommunity(undefined as any, 666));
    });
  });
});
