//@flow

import { createCustomTestStore } from './setup-redux';
import { toggleEditComment, toggleReplyEditor } from '../src/comments/commentAction';
import { openEditComment, openReplyBoxes } from '../src/comments/commentReducer';

describe('Comment Actions', () => {
  const store = createCustomTestStore({
    openReplyBoxes,
    openEditComment,
  });

  describe('toggleEditComment', () => {
    it('Toggle comment editing', async () => {
      const s = store.getState();
      expect(s.openEditComment).toStrictEqual([]);

      store.dispatch(
        toggleEditComment({
          id: 123,
        })
      );

      const s2 = store.getState();
      expect(s2.openEditComment).toStrictEqual([123]);

      store.dispatch(
        toggleEditComment({
          id: 456,
        })
      );
      store.dispatch(
        toggleEditComment({
          id: 123,
        })
      );

      const s3 = store.getState();
      expect(s3.openEditComment).toStrictEqual([456]);
    });
  });

  describe('toggleReplyEditor', () => {
    it('Toggle comment editing', async () => {
      const s = store.getState();
      expect(s.openReplyBoxes).toStrictEqual([]);

      store.dispatch(
        toggleReplyEditor({
          parentId: 123,
        })
      );

      const s2 = store.getState();
      expect(s2.openReplyBoxes).toStrictEqual([123]);

      store.dispatch(
        toggleReplyEditor({
          parentId: 123,
        })
      );

      store.dispatch(
        toggleReplyEditor({
          parentId: 456,
        })
      );

      const s3 = store.getState();
      expect(s3.openReplyBoxes).toStrictEqual([456]);
    });
  });
});
