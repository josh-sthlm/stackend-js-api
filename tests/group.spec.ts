import createTestStore from './setup';

import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { getGroup, GetGroupResult, Group, GroupType, Visibility } from '../src/group';
import assert from 'assert';
import ModerationStatus from '../src/api/ModerationStatus';

describe('Groups', () => {
  const store = createTestStore();

  describe('getGroup', () => {
    it('Get a group', async () => {
      const r: GetGroupResult = await store.dispatch(
        getGroup({ groupId: 1, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK })
      );
      expect(r.__resultCode).toBe('success');
      expect(r.groupMembers).toBeDefined();
      assert(r.group);
      expect(r.group.id).toBe(1);
    });
  });
});

export function mockGroup(id: number, name: string): Group {
  const now = Date.now();

  return {
    __type: 'net.josh.community.group.Group',
    id,
    name,
    permalink: 'group-' + id,
    description: 'Group ' + id,
    createdDate: now,
    blogKey: 'group-' + id,
    modifiedDate: now,
    ttl: 0,
    modStatus: ModerationStatus.PASSED,
    type: GroupType.BLOG,
    creatorUserId: 0,
    creatorUserRef: null,
    adminIds: [],
    adminsRef: [],
    categoryId: 0,
    backgroundImage: '',
    calendarId: 0,
    categoryRef: null,
    contentVisibility: Visibility.VISIBLE,
    darkLogotype: '',
    darkOrLightLogotype: '',
    featured: false,
    lightLogotype: '',
    nrOfMembers: 1,
    numberOfReaders: 1,
    obfuscatedReference: 'group-' + id,
    tags: [],
    openForApplications: true,
    rating: 0,
    visibility: Visibility.VISIBLE,
    totalNumberOfViews: 0,
    css: {
      headerFont: '',
      magazineColor: '',
      magazineColorDarker: '',
      magazineColorLighter: '',
      textColor: '',
      textFont: ''
    }
  };
}
