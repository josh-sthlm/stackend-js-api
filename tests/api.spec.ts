//@flow

import createTestStore from './setup-redux'
import {
  argsToObject,
  Config, constructReference,
  createUrl,
  getConfiguration, getInitialStoreValues, getTypeName,
  invertOrder,
  Order, parseCommunityContext, parseReference,
  STACKEND_DEFAULT_SERVER
} from '../src/api'
import { Community, CommunityStatus, STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'

describe('API', () => {
  let store = createTestStore();


	describe('invertOrder', () => {
		it("Should invert a sort order", () => {
      expect(invertOrder(Order.ASCENDING)).toBe(Order.DESCENDING);
      expect(invertOrder(Order.DESCENDING)).toBe(Order.ASCENDING);
      expect(invertOrder(Order.UNORDERED)).toBe(Order.UNORDERED);
		})
	});


	describe("getConfiguration", () => {
	  it("Should get stackend configuration from redux state", () => {
      let cfg:Config = store.dispatch(getConfiguration());
      expect(cfg).toBeDefined();
      expect(cfg.server).toBe(STACKEND_DEFAULT_SERVER);
    })
  });

  describe("createUrl", () => {
    it("Builds an url", () => {
      expect(createUrl({ path : "/test", params: { 'a': 1, 'b': ['b1', 'b2']}, hash: '#hash'})).toBe("/test?a=1&b=b1&b=b2#hash");
    })
  });

  describe("argsToObject", () => {
    it("Converts Arguments to an object", () => {

      let r:any = (function(x:any) {
        return argsToObject(arguments);
      })({ a: 'hello', b: 1, c: true });

      expect(r).toBeDefined();
      expect(r.a).toBe('hello');
      expect(r.b).toBe(1);
      expect(r.c).toBe(true);
    });
  });

  describe("getTypeName", () => {
    it("Gets the name of a stackend type", () => {
      expect(getTypeName('net.josh.community.blog.BlogEntry')).toBe("Post");
    })
  });


  describe("getInitialStoreValues", () => {
    it("Loads inital information about a community into the redux store", async () => {
      let r = await store.dispatch(getInitialStoreValues({ permalink: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");
      expect(r.stackendCommunity).toBeDefined();

      let c:Community = r.stackendCommunity;
      expect(c.id).toBe(55);
      expect(c.permalink).toBe(STACKEND_COM_COMMUNITY_PERMALINK);
      expect(c.name).toBe("stackend.com");
      expect(c.status).toBe(CommunityStatus.VISIBLE);
      expect(c.logotype).toBeDefined();
      expect(c.locale).toBe("en");
      expect(c.xcapCommunityName).toBe("c55");
      expect(c.xcapCommunityName).toBe("c55");
      expect(c.settings).toBeDefined();
      expect(c.style).toBeDefined();
    });
  });

  describe("parseCommunityContext", () => {
    it("Parses a community context", () => {
      expect(parseCommunityContext(null)).toBeNull();
      expect(parseCommunityContext("")).toBeNull();
      expect(parseCommunityContext("apa")).toBeNull();
      expect(parseCommunityContext("a:b")).toStrictEqual({ community: "a", context: "b"});
    })
  });

  describe("parseReference", () => {
    it ("Parses an object reference", () => {
      expect(parseReference(null)).toBeNull();
      expect(parseReference("")).toBeNull();
      expect(parseReference("a-b")).toBeNull();
      expect(parseReference("a-b-c")).toBeNull();
      expect(parseReference("a:b-t-c")).toBeNull();
      expect(parseReference("a:b-t-1")).toStrictEqual({
        communityContext: {
          community: "a",
          context: "b"
        },
        type: "t",
        id: 1
      });
    })
  });

  describe("constructReference", () => {
    it ("Constructs a reference", () => {
      expect(constructReference(	"c55", "comments", "se.josh.xcap.comment.Comment", 1)).toStrictEqual({
        communityContext: { community: "c55", context: "comments" },
        type: "se.josh.xcap.comment.Comment",
        id: 1
      });
    })
  });

});


