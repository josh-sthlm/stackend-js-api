import { setupServer, SetupServerApi } from 'msw/node';
import { rest } from 'msw';
import { newXcapJsonResult, setConfiguration } from '../../src/api';

export default function setupMockServerForTests(store: any): SetupServerApi {
  const server = setupServer();
  // Establish API mocking before all tests.
  beforeAll(() =>
    server.listen({
      onUnhandledRequest: 'warn'
    })
  );

  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => server.resetHandlers());

  // Clean up after the tests are finished.
  afterAll(() => server.close());

  // setup store
  store.dispatch(setConfiguration({ server: 'http://localhost' }));
  const state = store.getState();

  server.resetHandlers(
    rest.get(`${state.config.server}/api/xpresstoken`, async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(newXcapJsonResult('success', { xpressToken: '123456789', xcapAjaxToken: '123456789' }))
      );
    })
  );

  return server;
}
