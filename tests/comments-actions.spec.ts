//@flow

import createTestStore from './setup';
import { Comment, CommentModule } from '../src/comments';
import {
  fetchComment,
  fetchComments,
  receiveComments,
  removeCommentFromStore,
  requestComments,
  updateComment
} from '../src/comments/commentAction';
import { loadInitialStoreValues } from '../src/api/actions';
import { CommentsState } from '../src/comments/commentReducer';

const referenceId = 123;
const referenceGroupId = 456;

const FAKE_COMMENT_1 = {
  __type: 'se.josh.xcap.comment.impl.CommentImpl',
  id: 1,
  referenceId,
  referenceGroupId,
  body: 'Comment 1'
} as Comment;

const FAKE_COMMENT_2 = {
  __type: 'se.josh.xcap.comment.impl.CommentImpl',
  id: 2,
  referenceId,
  referenceGroupId,
  body: 'Comment 2'
} as Comment;

const FAKE_COMMENTS: Array<Comment> = [FAKE_COMMENT_1, FAKE_COMMENT_2];

describe('Comment actions', () => {
  const store = createTestStore();

  describe('fetchComments', () => {
    it('List comments', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur'
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

  describe('fetchComment', () => {
    it('Get a single comment', async () => {
      let s: CommentsState = store.getState().GroupComments;

      function get(s: CommentsState): any {
        return s[':3']?.json?.comments[300007];
      }

      let x = get(s);
      expect(x).toBeDefined();
      expect(x.entries.length).toBe(4);
      const id = x.entries[x.entries.length - 1].id;

      store.dispatch(
        removeCommentFromStore({ module: CommentModule.GENERIC, id, referenceId: 300007, referenceGroupId: 3 })
      );
      s = store.getState().GroupComments;
      x = get(s);
      expect(x.entries.length).toBe(3);
      const idx = x.entries.findIndex((c: Comment) => c.id === id);
      expect(idx === -1).toBeTruthy();

      await store.dispatch(
        fetchComment({
          referenceId: 300007,
          referenceGroupId: 3,
          module: CommentModule.GENERIC,
          id
        })
      );

      s = store.getState().GroupComments;
      x = get(s);
      expect(x.entries.length).toBe(4);
      const i = x.entries.findIndex((c: Comment) => c.id === id);
      expect(i !== -1).toBeTruthy();
      const y = x.entries[i];
      expect(y).toBeDefined();
      expect(y.id).toBe(id);
    });
  });

  describe('state manipulation', () => {
    it('manipulates state', () => {
      // Unless this is done, receiveComments will crash
      store.dispatch(requestComments(CommentModule.GENERIC, referenceId, referenceGroupId));

      store.dispatch(
        receiveComments(CommentModule.GENERIC, referenceId, referenceGroupId, {
          comments: { entries: FAKE_COMMENTS },
          likesByCurrentUser: {},
          error: undefined
        })
      );

      function get(state: CommentsState): any {
        return state[':' + referenceGroupId]?.json?.comments[referenceId];
      }

      let s: CommentsState = store.getState().GroupComments;
      let x = get(s);
      expect(x).toBeDefined();
      expect(x.entries).toBeDefined();
      expect(x.entries[0].id).toBe(1);
      expect(x.entries[1].id).toBe(2);

      // Update
      store.dispatch(
        updateComment(1, CommentModule.GENERIC, referenceId, referenceGroupId, {
          ...FAKE_COMMENT_1,
          body: 'Tjo!'
        } as Comment)
      );
      s = store.getState().GroupComments;
      x = get(s);
      expect(x.entries[0].id).toBe(1);
      expect(x.entries[0].body).toBe('Tjo!');

      // Remove
      store.dispatch(removeCommentFromStore({ module: CommentModule.GENERIC, id: 1, referenceId, referenceGroupId }));
      s = store.getState().GroupComments;
      x = get(s);
      expect(x.entries).toBeDefined();
      expect(x.entries[0].id).toBe(2);
    });
  });
});
