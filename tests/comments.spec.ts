//@flow

import createTestStore from './setup-redux';
import { CommentModule, getComments, GetCommentsResult } from '../src/comments'
import { COMMUNITY_PARAMETER } from '../src/api';

describe('Comments', () => {

  let store = createTestStore();
  let state = store.getState();
  expect(state.GroupComments).toBeDefined();

  describe("getComments", () => {
    it("List comments", async () => {
      let r:GetCommentsResult = await store.dispatch(getComments({ referenceId: 300007,  module: CommentModule.GENERIC, [COMMUNITY_PARAMETER]: 'husdjur' }));
      expect(r.__resultCode).toBe("success");
      expect(r.comments).toBeDefined();
      expect(r.comments.totalSize).toBeGreaterThanOrEqual(2);
      expect(r.comments.entries).toBeDefined();

      let e = r.comments.entries[0];
      expect(e).toBeDefined();
      expect(e.__type).toBe('se.josh.xcap.comment.impl.CommentImpl');
      expect(e.referenceId).toBe(300007);
      expect(e.creatorUserRef).toBeDefined();
      expect(e.commentThreadRef).toBeDefined();

      let t = e.commentThreadRef;
      expect(t.id).toBe(300007);
      expect(t.extraInformation).toBeDefined();
      expect(t.extraInformation.referer).toBeDefined();
      expect(t.extraInformation.referer.url).toBeDefined();
    })
  });

});