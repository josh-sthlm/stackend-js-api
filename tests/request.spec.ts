import { AnchorType, getAnchorPart, parseAnchor, StackendAnchor } from '../src/request';

describe('Request', () => {
  describe('Parse request', () => {
    it('Parse blog anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('blog/groups/peters-social-feed');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.BLOG);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('blog');
      expect(ap.permalink).toBe('groups/peters-social-feed');
      expect(ap.blogEntryPermalink).toBeFalsy();
      expect(ap.blogKey).toBe('groups/peters-social-feed');
    });

    it('Parse blog entry anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('blog/groups/peters-social-feed/taggar2');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.BLOG);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('blog');
      expect(ap.permalink).toBe('groups/peters-social-feed/taggar2');
      expect(ap.blogEntryPermalink).toBe('taggar2');
      expect(ap.blogKey).toBe('groups/peters-social-feed');
    });

    it('Parse tags anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('tags/mytag/mysecondtag');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.TAGS);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('tags');
      expect(ap.permalink).toBe('mytag/mysecondtag');
      expect(ap.tags?.sort()).toEqual(['mytag', 'mysecondtag'].sort());
    });

    it('Parse forum anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('forum/peters-forum');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.FORUM);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('forum');
      expect(ap.permalink).toBe('peters-forum');
      expect(ap.forumPermalink).toBe('peters-forum');
      expect(ap.forumThreadPermalink).toBeFalsy();
    });

    it('Parse forum thread anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('forum/peters-forum/my-thread');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.FORUM);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('forum');
      expect(ap.permalink).toBe('peters-forum/my-thread');
      expect(ap.forumPermalink).toBe('peters-forum');
      expect(ap.forumThreadPermalink).toBe('my-thread');
    });
  });
});
