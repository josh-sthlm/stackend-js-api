import { Community, Theme } from '../src/stackend';
import ModerationStatus from '../src/api/ModerationStatus';

export default function CommunityMock(props?: Partial<Community>): Community {
  const id = Math.round(1000 * Math.random());
  return Object.assign(
    {
      __type: 'se.josh.xcap.community.Community',
      id,
      name: 'Test ' + id,
      description: '',
      permalink: 'test-' + id,
      xcapCommunityName: 'c' + id,
      status: 'VISIBLE',
      logotype: null,
      locale: 'en_US',
      domains: [],
      adminUserIds: [1],
      adminsUserRef: [],
      moderatorUserIds: [],
      moderatorUserRef: [],
      theme: Theme.STACKEND,
      settings: [],
      style: '',
      creatorUserId: 1,
      createdDate: Date.now(),
      modStatus: ModerationStatus.NONE,
      expiresDate: 2145916861000
    },
    props
  );
}
