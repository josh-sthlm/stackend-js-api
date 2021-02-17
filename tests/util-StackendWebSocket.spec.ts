import StackendWebSocket, {
  addInitializer,
  CommentsSubscription,
  getInstance,
  StackendWebSocketEvent
} from '../src/util/StackendWebSocket';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { Community } from '../src/stackend';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Util', () => {
  const store = createTestStore();

  let myInitializerRun = 0;
  let pongs = 0;

  describe('StackendWebSocket', () => {
    it('getInstance', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur'
        })
      );

      const community: Community = store.getState().communities.community;

      addInitializer(sws => {
        sws.setDebug(true);

        sws.addListener((type, event, message) => {
          console.log('Got notification: ', type, event, message);
        });

        sws.addRealTimeListener((type, event, message) => {
          console.log('Got real time notification: ', type, event, message);
          if (message && message.messageType === 'PONG') {
            pongs++;
          }
        }, community.xcapCommunityName);

        myInitializerRun++;
      });

      const sws: StackendWebSocket = store.dispatch(getInstance());
      expect(sws).toBeDefined();
      expect(myInitializerRun).toBe(1);
      await sleep(1000); // Allow connection to establish

      console.log(sws);

      const sws2 = store.dispatch(getInstance());
      expect(sws === sws2).toBeTruthy(); // Same instance
      expect(myInitializerRun).toBe(1);
    });

    it('getBroadcastIdentifier', async () => {
      const sws: StackendWebSocket = store.dispatch(getInstance());
      expect(sws._getBroadcastIdentifier()).toBe('*');
      expect(sws._getBroadcastIdentifier(StackendWebSocketEvent.MESSAGE_RECEIVED)).toBe(
        StackendWebSocketEvent.MESSAGE_RECEIVED
      );
      expect(sws._getBroadcastIdentifier(StackendWebSocketEvent.MESSAGE_RECEIVED, 'a', 'b')).toBe(
        StackendWebSocketEvent.MESSAGE_RECEIVED + '-a-b'
      );
    });

    it('ping', async () => {
      const sws: StackendWebSocket = store.dispatch(getInstance());
      const community: Community = store.getState().communities.community;
      sws.ping(community.xcapCommunityName);
      await sleep(1000);
      expect(pongs).toBe(1);
    });

    it('subscribe/unsubscribe', async () => {
      const sws: StackendWebSocket = store.dispatch(getInstance());
      const community: Community = store.getState().communities.community;
      const sub = new CommentsSubscription(community.xcapCommunityName, 'comments', 123);
      sws.subscribe(sub);
      await sleep(500);
      sws.unsubscribe(sub);
      await sleep(500);
    });

    it('close', async () => {
      const sws: StackendWebSocket = store.dispatch(getInstance());
      sws.close();
    });
  });
});
