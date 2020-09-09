//@flow

import createTestStore from './setup';
import { CommentModule } from '../src/comments';
import { fetchComments } from '../src/comments/commentAction';
import { loadInitialStoreValues } from '../src/api/actions';

describe('Comment actions', () => {
  const store = createTestStore();

  describe('fetchComments', () => {
    it('List comments', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur',
        })
      );

      const s = store.getState();

      expect(s.communities).toBeDefined();
      expect(s.communities.community).toBeDefined();
      expect(s.communities.community.permalink).toBe('husdjur');
      expect(s.GroupComments).toBeDefined();

      await store.dispatch(
        fetchComments({ referenceId: 300007, referenceGroupId: 3, module: CommentModule.GENERIC, pageSize: 4 })
      );

      const s2 = store.getState();
      expect(s2.GroupComments[':3']).toBeDefined();
      expect(s2.GroupComments[':3'].json.comments).toBeDefined();
      expect(s2.GroupComments[':3'].json.comments['300007']).toBeDefined();
      const c = s2.GroupComments[':3'].json.comments['300007'];
      expect(c.totalSize).toBeGreaterThan(1);
      expect(c.pageSize).toBe(4);
      expect(c.entries).toBeDefined();
      expect(c.entries.length).toBeGreaterThan(1);
      console.log('Got', c.entries.length, 'entries');
    });
  });
});
