import createTestStore from './setup';

import assert from 'assert';
import { fetchGroup, fetchMyGroups, getGroupById, getGroupByPermalink, getMyGroups } from '../src/group/groupActions';
import { Group } from '../src/group';
import { GroupState } from '../src/group/groupReducer';
import LoadingState from '../src/api/LoadingState';
import { initialize } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';

describe('Groups', () => {
  const store = createTestStore();

  describe('groupActions', () => {
    it('fetchMyGroups', async () => {
      await store.dispatch(
        initialize({
          permalink: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      await store.dispatch(fetchMyGroups());
      const groups: GroupState = store.getState().groups;
      assert(groups);
      expect(groups.myGroups.loadingState).toBe(LoadingState.READY);
      expect(getMyGroups(groups)).toStrictEqual([]); // Anonymous user does not have groups
    });

    it('fetchGroup', async () => {
      const g: Group | null = await store.dispatch(fetchGroup({ groupId: 1 }));
      assert(g);
      expect(g.id).toBe(1);
      expect(g.permalink).toBe('groups/news');
      const groups: GroupState = store.getState().groups;
      assert(groups);
      const g1 = getGroupById(groups, 1);
      assert(g1);
      expect(g1.id).toBe(1);
      expect(g1.permalink).toBe('groups/news');
      const g2 = getGroupByPermalink(groups, 'groups/news');
      assert(g2);
      expect(g1 === g2).toBeTruthy();
    });
  });
});
