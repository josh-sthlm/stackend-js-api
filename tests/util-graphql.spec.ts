import {
  forEachGraphQLList,
  getNextCursor,
  getPreviousCursor,
  GraphQLList,
  mapGraphQLList,
  nextPage,
  previousPage,
  toQueryParameters
} from '../src/util/graphql';
import { ListProductsRequest } from '../src/shop';

describe('GraphQL', () => {
  describe('next/previousPage', () => {
    it('nextPage ', () => {
      expect(
        nextPage(
          {
            after: 'a',
            before: 'b',
            first: 10,
            last: 20,
            q: 'test',
            tags: ['a', 'b']
          } as ListProductsRequest,
          'new-after'
        )
      ).toStrictEqual({
        after: 'new-after',
        first: 10,
        q: 'test',
        tags: ['a', 'b']
      });

      expect(
        nextPage(
          {
            after: 'a',
            before: 'b',
            first: 10,
            last: 20,
            q: 'test',
            tags: ['a', 'b']
          } as ListProductsRequest,
          'new-after',
          5
        )
      ).toStrictEqual({
        after: 'new-after',
        first: 5,
        q: 'test',
        tags: ['a', 'b']
      });
    });

    it('previousPage ', () => {
      expect(
        previousPage(
          {
            after: 'a',
            before: 'b',
            first: 20,
            last: 10,
            q: 'test',
            tags: ['a', 'b']
          } as ListProductsRequest,
          'new-before'
        )
      ).toStrictEqual({
        before: 'new-before',
        last: 10,
        q: 'test',
        tags: ['a', 'b']
      });

      expect(
        previousPage(
          {
            after: 'a',
            before: 'b',
            first: 20,
            last: 10,
            q: 'test',
            tags: ['a', 'b']
          } as ListProductsRequest,
          'new-before',
          5
        )
      ).toStrictEqual({
        before: 'new-before',
        last: 5,
        q: 'test',
        tags: ['a', 'b']
      });
    });
  });

  describe('forEachGraphQLList', () => {
    it('Iterates a GraphQLList ', () => {
      let i = 0;
      forEachGraphQLList({ edges: [] }, item => {
        i++;
      });
      expect(i).toBe(0);

      const list: GraphQLList<{ name: string }> = {
        edges: [{ node: { name: 'a' } }, { node: { name: 'b' } }]
      };

      const x: Array<string> = [];
      forEachGraphQLList(list, nodeValue => {
        x.push(nodeValue.name);
      });

      expect(x).toStrictEqual(['a', 'b']);
    });
  });

  describe('mapGraphQLList', () => {
    it('maps a GraphQLList ', () => {
      expect(mapGraphQLList({ edges: [] }, item => item)).toStrictEqual([]);

      const list: GraphQLList<{ name: string }> = {
        edges: [{ node: { name: 'a' } }, { node: { name: 'b' } }]
      };

      const x: Array<string> = mapGraphQLList(list, item => item.name);
      expect(x).toStrictEqual(['a', 'b']);
    });
  });

  describe('next/previousCursor', () => {
    it('getNextCursor', () => {
      expect(getNextCursor({ pageInfo: { hasNextPage: false, hasPreviousPage: false }, edges: [] })).toBeNull();

      expect(
        getNextCursor({
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
          edges: [{ node: {}, cursor: 'c-1' }]
        })
      ).toBe('c-1');

      expect(
        getNextCursor({
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          edges: [
            { node: {}, cursor: 'c-1' },
            { node: {}, cursor: 'c-2' }
          ]
        })
      ).toBeNull();

      expect(
        getNextCursor({
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
          edges: [
            { node: {}, cursor: 'c-1' },
            { node: {}, cursor: 'c-2' }
          ]
        })
      ).toBe('c-2');
    });

    it('getPreviousCursor', () => {
      expect(getPreviousCursor({ pageInfo: { hasNextPage: false, hasPreviousPage: false }, edges: [] })).toBeNull();

      expect(
        getPreviousCursor({
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          edges: [{ node: {}, cursor: 'c-1' }]
        })
      ).toBeNull();

      expect(
        getPreviousCursor({
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
          edges: [{ node: {}, cursor: 'c-1' }]
        })
      ).toBe('c-1');

      expect(
        getPreviousCursor({
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
          edges: [
            { node: {}, cursor: 'c-1' },
            { node: {}, cursor: 'c-2' }
          ]
        })
      ).toBe('c-1');
    });
  });
  describe('toQueryParameters', () => {
    it('converts a js object into GraphQL query parameters', () => {
      expect(toQueryParameters(null)).toBe('null');
      expect(toQueryParameters(undefined)).toBe('null');
      expect(toQueryParameters(false)).toBe('false');
      expect(toQueryParameters(1.23)).toBe('1.23');
      expect(toQueryParameters('apa')).toBe('"apa"');
      expect(toQueryParameters([])).toBe('[]');
      expect(toQueryParameters([null, 1, 'apa'])).toBe('[null,1,"apa"]');
      expect(toQueryParameters([{ a: 1, b: 'apa' }, [1, 2]])).toBe('[{a:1,b:"apa"},[1,2]]');
      expect(toQueryParameters({})).toBe('{}');
      expect(toQueryParameters({ a: null, b: 1, c: 'apa' })).toBe('{a:null,b:1,c:"apa"}');
      expect(toQueryParameters({ a: [1, 2], b: { a: 1, b: 'apa' } })).toBe('{a:[1,2],b:{a:1,b:"apa"}}');
    });
  });
});
