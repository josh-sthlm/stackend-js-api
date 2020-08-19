//@flow

import createTestStore from './setup-redux';
import { CommentModule, getComments, GetCommentsResult } from '../comments';
import { COMMUNITY_PARAMETER } from '../api';

describe('Comments', () => {

  const store = createTestStore();
  const state = store.getState();
  expect(state.GroupComments).toBeDefined();

  describe("getComments", () => {
    it("List comments", async () => {
      const r: GetCommentsResult = await store.dispatch(getComments({ referenceId: 300007,  module: CommentModule.GENERIC, [COMMUNITY_PARAMETER]: 'husdjur' }));
      expect(r.__resultCode).toBe("success");
      expect(r.comments).toBeDefined();
      expect(r.comments.totalSize).toBeGreaterThanOrEqual(2);
      expect(r.comments.entries).toBeDefined();

      const e = r.comments.entries[0];
      expect(e).toBeDefined();
      expect(e.__type).toBe('se.josh.xcap.comment.impl.CommentImpl');
      expect(e.referenceId).toBe(300007);
      expect(e.creatorUserRef).toBeDefined();
      /* FIXME: missing props?
      expect(e.commentThreadRef).toBeDefined();

      const t = e.commentThreadRef;
      expect(t.id).toBe(300007);
      expect(t.extraInformation).toBeDefined();
      expect(t.extraInformation.referer).toBeDefined();
      expect(t.extraInformation.referer.url).toBeDefined();
       */
    })
  });

});
