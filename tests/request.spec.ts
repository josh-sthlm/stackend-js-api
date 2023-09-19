import { AnchorType, getAnchorPart, parseAnchor, StackendAnchor } from '../src/request';

describe('Request', () => {
  describe('Parse request', () => {
    it('Parse blog entry anchor', async () => {
      const anchor: StackendAnchor | null = parseAnchor('blog/groups/peters-social-feed');

      expect(anchor).toBeDefined();

      const anchorPart = getAnchorPart(anchor, AnchorType.BLOG);

      expect(anchorPart).toBeDefined();

      const ap = anchorPart as StackendAnchor;

      expect(ap.type).toBe('blog');
      expect(ap.permalink).toBe('groups/peters-social-feed');
      expect(ap.blogEntryPermalink).toBe(null);
      expect(ap.blogKey).toBe('groups/peters-social-feed');
    });

    it('Parse blog anchor', async () => {
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
      // @ts-ignore
      expect(ap.tags.sort()).toEqual(['mytag', 'mysecondtag'].sort());
    });
  });
});
