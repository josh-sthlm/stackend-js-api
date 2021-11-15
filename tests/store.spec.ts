import createTestStore from './setup';

describe('Store', () => {
  describe('store', () => {
    it('Should contain Stackend basic values', () => {
      const store = createTestStore();
      const state = store.getState();
      expect(state.config).toBeDefined();
      expect(state.currentUser).toBeDefined();
      expect(state.references).toBeDefined();
      expect(state.request).toBeDefined();
      expect(state.communities).toBeDefined();
      expect(state.modules).toBeDefined();
      expect(state.blogs).toBeDefined();
      expect(state.groupBlogEntries).toBeDefined();
      expect(state.categories).toBeDefined();
      expect(state.cmsContent).toBeDefined();
      expect(state.pages).toBeDefined();
      expect(state.GroupComments).toBeDefined();
      expect(state.forums).toBeDefined();
      expect(state.forumThreads).toBeDefined();
      expect(state.editForumThread).toBeDefined();
      expect(state.groups).toBeDefined();
      expect(state.qna).toBeDefined();
      expect(state.search).toBeDefined();
      expect(state.shop).toBeDefined();
      expect(state.throbber).toBeDefined();
      expect(state.vote).toBeDefined();
    });
  });
});
