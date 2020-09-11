//@flow

import createTestStore from './setup';
import { get, GetMediaResult, list, ListResult, MediaListOrder, ThumbnailSize } from '../src/media';
import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { DEFAULT_CMS_CONTEXT } from '../src/cms';
import assert from 'assert';

describe('Media', () => {
  const store = createTestStore();

  describe('getMedia', () => {
    it('Gets a media object', async () => {
      const r: GetMediaResult = await store.dispatch(
        get({
          id: 2,
          context: DEFAULT_CMS_CONTEXT,
          thumbnailConfigName: ThumbnailSize.MEDIUM,
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      expect(r.__resultCode).toBe('success');
      assert(r.media);
      expect(r.media.id).toBe(2);
      expect(r.html).toBe(
        '<img src="https://api.stackend.com/media/get/c55/cms/developers-jpg.jpg" alt="" width="1250" height="631" style="max-width:1250px;" class="stackend-responsive"/>'
      );
      assert(r.thumbnail);
      expect(r.thumbnail.mediaId).toBe(2);
      expect(r.thumbnail.url).toBeDefined();
    });
  });

  describe('list', () => {
    it('List media files', async () => {
      const r: ListResult = await store.dispatch(
        list({
          context: DEFAULT_CMS_CONTEXT,
          pageSize: 2,
          order: MediaListOrder.CREATED_ASC,
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      expect(r.__resultCode).toBe('success');
      expect(r.mediaPaginated).toBeDefined();
      expect(r.thumbnailsByMediaId).toBeDefined();
      expect(r.mediaPaginated.totalSize).toBeGreaterThanOrEqual(1);
      expect(r.mediaPaginated.entries).toBeDefined();

      const m = r.mediaPaginated.entries[0];
      expect(m).toBeDefined();
      expect(m.id).toBe(2);
    });
  });
});
