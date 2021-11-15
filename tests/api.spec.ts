import createTestStore from './setup';
import {
  argsToObject,
  Config,
  createUrl,
  getConfiguration,
  getInitialStoreValues,
  getTypeName,
  STACKEND_DEFAULT_SERVER,
  templateReplace,
  templateReplaceUrl,
  _constructConfig,
  STACKEND_DEFAULT_CONTEXT_PATH,
  DeployProfile,
  setConfiguration,
  newXcapJsonResult,
  GetInitialStoreValuesResult
} from '../src/api';
import { invertOrder, Order } from '../src/api/Order';
import { CommunityStatus, STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import assert from 'assert';
import { listMy, ListResult } from '../src/media';
import { getProductListKey } from '../src/shop/shopActions';
import { urlEncodeParameters } from '../src/api/LoadJson';
import { parseCommunityContext } from '../src/api/CommunityContext';
import { constructReference, getReferenceAsString, parseReference } from '../src/api/Reference';

describe('API', () => {
  const store = createTestStore();

  describe('invertOrder', () => {
    it('Should invert a sort order', () => {
      expect(invertOrder(Order.ASCENDING)).toBe(Order.DESCENDING);
      expect(invertOrder(Order.DESCENDING)).toBe(Order.ASCENDING);
      expect(invertOrder(Order.UNORDERED)).toBe(Order.UNORDERED);
    });
  });

  describe('getConfiguration', () => {
    it('Should get stackend configuration from redux state', async () => {
      const c: Config = store.dispatch(getConfiguration());
      expect(c).toBeDefined();
      expect(c.server).toBe(STACKEND_DEFAULT_SERVER);
      expect(c.contextPath).toBe(STACKEND_DEFAULT_CONTEXT_PATH);
      expect(c.apiUrl).toBe(STACKEND_DEFAULT_SERVER + '' + STACKEND_DEFAULT_CONTEXT_PATH + '/api');
      expect(c.deployProfile).toBe(DeployProfile.STACKEND);
      expect(c.recaptchaSiteKey).toBeNull();
      expect(c.gaKey).toBeNull();
    });
  });

  describe('createUrl', () => {
    it('Builds an url', () => {
      expect(createUrl({ path: '/test', params: { a: 1, b: ['b1', 'b2'] }, hash: '#hash' })).toBe(
        '/test?a=1&b=b1&b=b2#hash'
      );
    });
  });

  describe('argsToObject', () => {
    it('Converts Arguments to an object', () => {
      const r: any = (function (x: any): any {
        return argsToObject(arguments);
      })({ a: 'hello', b: 1, c: true });

      expect(r).toBeDefined();
      expect(r.a).toBe('hello');
      expect(r.b).toBe(1);
      expect(r.c).toBe(true);
    });
  });

  describe('getTypeName', () => {
    it('Gets the name of a stackend type', () => {
      expect(getTypeName('net.josh.community.blog.BlogEntry')).toBe('Post');
    });
  });

  describe('getInitialStoreValues', () => {
    it('Loads initial information about a community into the redux store', async () => {
      const r: GetInitialStoreValuesResult = await store.dispatch(
        getInitialStoreValues({ permalink: STACKEND_COM_COMMUNITY_PERMALINK })
      );
      expect(r.__resultCode).toBe('success');
      expect(r.stackendCommunity).toBeDefined();

      const c = r.stackendCommunity;
      assert(c);
      expect(c.id).toBe(55);
      expect(c.permalink).toBe(STACKEND_COM_COMMUNITY_PERMALINK);
      expect(c.name).toBe('stackend.com');
      expect(c.status).toBe(CommunityStatus.VISIBLE);
      expect(c.logotype).toBeDefined();
      expect(c.locale).toBe('en');
      expect(c.xcapCommunityName).toBe('c55');
      expect(c.xcapCommunityName).toBe('c55');
      expect(c.settings).toBeDefined();
      expect(c.style).toBeDefined();
      expect(r.shopData).toBeNull();
    });

    it('Shop values', async () => {
      const listing = {
        first: 1,
        productTypes: ['Boots']
      };
      const key = store.dispatch(getProductListKey(listing));

      const r: GetInitialStoreValuesResult = await store.dispatch(
        getInitialStoreValues({
          permalink: 'husdjur',
          productHandles: ['snare-boot'],
          productCollectionHandles: ['latest-stuff'],
          productListings: [listing]
        })
      );
      expect(r.__resultCode).toBe('success');
      assert(r.shopData);

      expect(r.shopData.products).toBeDefined();
      expect(r.shopData.products['snare-boot']).toBeDefined();
      expect(r.shopData.collections).toBeDefined();
      expect(r.shopData.collections['latest-stuff']).toBeDefined();
      expect(r.shopData.listings).toBeDefined();
      expect(r.shopData.listings[key]).toBeDefined();
      expect(r.shopData.listings[key].listing).toBeDefined();
      expect(r.shopData.listings[key].request).toBeDefined();
    });
  });

  describe('parseCommunityContext', () => {
    it('Parses a community context', () => {
      expect(parseCommunityContext(null)).toBeNull();
      expect(parseCommunityContext('')).toBeNull();
      expect(parseCommunityContext('apa')).toBeNull();
      expect(parseCommunityContext('a:b')).toStrictEqual({ community: 'a', context: 'b' });
    });
  });

  describe('parseReference', () => {
    it('Parses an object reference', () => {
      expect(parseReference(null)).toBeNull();
      expect(parseReference('')).toBeNull();
      expect(parseReference('a-b')).toBeNull();
      expect(parseReference('a-b-c')).toBeNull();
      expect(parseReference('a:b-t-c')).toBeNull();
      expect(parseReference('a:b-t-1')).toStrictEqual({
        communityContext: {
          community: 'a',
          context: 'b'
        },
        type: 't',
        id: 1
      });
    });
  });

  describe('constructReference', () => {
    it('Constructs a reference', () => {
      expect(constructReference('c55', 'comments', 'se.josh.xcap.comment.Comment', 1)).toStrictEqual({
        communityContext: { community: 'c55', context: 'comments' },
        type: 'se.josh.xcap.comment.Comment',
        id: 1
      });
    });
  });

  describe('getReferenceAsString', () => {
    it('Creates a string version of a Reference', () => {
      expect(getReferenceAsString(null)).toBeNull();
      expect(getReferenceAsString(parseReference('a:b-t-1'))).toBe('a:b-t-1');
    });
  });

  describe('templateReplace', () => {
    it('Does string substitution ', () => {
      expect(
        templateReplace('Hello {{name}}, how are you?', {
          name: 'World',
          extra: 'Wow'
        })
      ).toBe('Hello World, how are you?');

      expect(
        templateReplace('{{a}}, {{b}}, {{noValue}}, {{c}}', {
          a: 'a',
          b: 'b',
          c: 'c'
        })
      ).toBe('a, b, , c');
    });
  });

  describe('templateReplaceUrl', () => {
    it('Url string substitution', () => {
      expect(templateReplaceUrl('/path?a={{a}}', { a: 'apan ola', b: 'bosse' })).toBe('/path?a=apan%20ola');
    });
  });

  describe('_constructConfig', () => {
    it('Creates a default configuration', () => {
      const c = _constructConfig();
      expect(c).toBeDefined();
      expect(c.server).toBe(STACKEND_DEFAULT_SERVER);
      expect(c.contextPath).toBe(STACKEND_DEFAULT_CONTEXT_PATH);
      expect(c.apiUrl).toBe(STACKEND_DEFAULT_SERVER + '' + STACKEND_DEFAULT_CONTEXT_PATH + '/api');
      expect(c.deployProfile).toBe(DeployProfile.STACKEND);
      expect(c.recaptchaSiteKey).toBeNull();
      expect(c.gaKey).toBeNull();
    });
  });

  describe('newXcapJsonResult', () => {
    it('Constructs a new result', async () => {
      let r = newXcapJsonResult('success');
      expect(r.__resultCode).toBe('success');
      expect(r.error).toBeUndefined();

      r = newXcapJsonResult('error');
      expect(r.__resultCode).toBe('error');
      expect(r.error).toBeDefined();
      assert(r.error);
      expect(r.error.actionErrors).toStrictEqual(['error']);

      r = newXcapJsonResult('success', { hej: true });
      expect(r.__resultCode).toBe('success');
      expect(r.error).toBeUndefined();
      expect(r.hej).toBe(true);
    });
  });

  describe('LoadJson', () => {
    it('Handle errors correctly', async () => {
      // This request will fail
      const r: ListResult = await store.dispatch(
        listMy({
          context: 'korv',
          mediaType: 666
        })
      );

      expect(r).toBeDefined();
      expect(r.__resultCode).toBe('error');
      expect(r.error).toBeDefined();
    });
  });

  // Must be last to not mess upp the rest of the tests
  describe('setConfig', () => {
    it('Alter the configuration', async () => {
      await store.dispatch(
        setConfiguration({
          server: 'http://localhost:8080/',
          contextPath: '/stackend/'
        })
      );

      const c: Config = await store.dispatch(getConfiguration());
      expect(c).toBeDefined();
      expect(c.server).toBe('http://localhost:8080/');
      expect(c.apiUrl).toBe('http://localhost:8080/stackend/api');
    });
  });

  describe('urlEncodeParameters', () => {
    it('Encode url parameters', () => {
      const r = urlEncodeParameters({
        test: 'räksmörgås',
        apa: 'ola'
      });
      expect(r).toBe('test=r%C3%A4ksm%C3%B6rg%C3%A5s&apa=ola');
    });
  });
});
