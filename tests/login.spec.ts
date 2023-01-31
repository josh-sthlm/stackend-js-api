import { AuthenticationType, login, LoginResult } from '../src/login';
import { COMMUNITY_PARAMETER } from '../src/api';
import setupMockServerForTests from './test-utils/setupMockServerForTests';
import { rest } from 'msw';
import createTestStore from './setup';

describe('Login', () => {
  describe('Compile', () => {
    it('Check that login compiles', async () => {
      expect(login).toBeDefined();
    });
  });

  describe('Login with email and password works', () => {
    const store = createTestStore();
    const server = setupMockServerForTests(store);
    const state = store.getState();

    it('Sends the correct parameters', async () => {
      server.use(
        rest.post<any, LoginResult>(`${state.config.server}/test/api/user/login`, async (req, res, ctx) => {
          const urlSearchParams = new URLSearchParams(req.body);

          expect(urlSearchParams.get('xcap_email')).toStrictEqual('peter@josh.se');
          expect(urlSearchParams.get('xcap_password')).toStrictEqual('myPassword');
          expect(urlSearchParams.get('__community')).toStrictEqual('test');
          expect(urlSearchParams.get('c')).toStrictEqual('test');
          expect(urlSearchParams.get('communityPermalink')).toBeNull();

          return res(ctx.status(200), ctx.json({}));
        })
      );

      const res = await store.dispatch(
        login({
          provider: AuthenticationType.XCAP,
          [COMMUNITY_PARAMETER]: 'test',
          email: 'peter@josh.se',
          password: 'myPassword',
          config: state.config,
          request: null as any
        })
      );

      expect(res.error).toBeUndefined();
    });
  });
});
