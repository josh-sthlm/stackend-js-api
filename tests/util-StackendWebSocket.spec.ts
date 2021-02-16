import { addInitializer, getInstance, StackendWebSocketEvent } from '../src/util/StackendWebSocket';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';

describe('Util', () => {
  const store = createTestStore();

  let myInitializerRun = 0;
  let pongs = 0;
  let events = 0;

  describe('StackendWebSocket', () => {
    it('addInitializer', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur'
        })
      );

      addInitializer(sws => {
        const key = sws.getBroadcastIdentifier(undefined, undefined, StackendWebSocketEvent.MESSAGE_RECEIVED);
        console.log(key);
        sws.addListener(key, (event, data) => {
          console.log('Got notification: ', event, data);
          events++;
          if (event == 'PONG') {
            pongs++;
          }
        });
        myInitializerRun++;
      });
    });

    it('getInstance', () => {
      const sws = store.dispatch(getInstance());
      expect(sws).toBeDefined();
      expect(myInitializerRun).toBe(1);
      const sws2 = store.dispatch(getInstance());
      expect(sws === sws2).toBeTruthy(); // Same instance
      expect(myInitializerRun).toBe(1);
    });

    it('broadcast', async () => {
      const sws = store.dispatch(getInstance());
      sws.broadcast(StackendWebSocketEvent.MESSAGE_RECEIVED, { a: 1 });
      expect(events).toBe(1);
    });

    it('ping', async () => {
      const sws = store.dispatch(getInstance());
      sws.ping();

      await new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      });

      expect(pongs).toBe(1);
    });

    it('close', async () => {
      const sws = store.dispatch(getInstance());
      sws.close();
    });
  });
});
