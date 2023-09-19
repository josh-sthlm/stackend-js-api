import { getTagsFromPathname, normalizeTags } from '../src/tags';

describe('Tags', () => {
  describe('Functions', () => {
    it('Normalize tags', async () => {
      const result = normalizeTags(['aaa', 'ccc', 'bbb']);
      expect(result).toEqual(['aaa', 'bbb', 'ccc']);
    });

    it('Normalize empty tags', async () => {
      const result = normalizeTags(undefined);
      expect(result).toEqual([]);
    });

    it('Get tags from pathname', async () => {
      const result = getTagsFromPathname({
        pathname:
          'https://xcap.de/bjorkman/live-shop/#/site/peters-site/peters-social-page;/blog/groups/peters-social-feed/taggar2;/tags/entagg/entaggtill'
      });
      expect(result).toEqual(['entagg', 'entaggtill']);
    });
    it('Get tags from pathname (only pathname)', async () => {
      const result = getTagsFromPathname({
        pathname: '/site/peters-site/peters-social-page;/blog/groups/peters-social-feed/taggar2;/tags/entagg/entaggtill'
      });
      expect(result).toEqual(['entagg', 'entaggtill']);
    });
  });
});
