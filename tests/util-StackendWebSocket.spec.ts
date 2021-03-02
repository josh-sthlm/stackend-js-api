import StackendWebSocket, {
  addInitializer,
  CommentsSubscription,
  getInstance,
  REALTIME_COMPONENT,
  REALTIME_CONTEXT,
  RealTimeFunctionName,
  RealTimeListener,
  RealTimePayload,
  StackendWebSocketEvent
} from '../src/util/StackendWebSocket';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { Community } from '../src/stackend';
import { COMMENT_CLASS } from '../src/comments';

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

        sws.addMessageListener(
          (type, event, message) => {
            console.log('Got real time notification: ', type, event, message);
            if (message && message.messageType === 'PONG') {
              pongs++;
            }
          },
          REALTIME_COMPONENT,
          REALTIME_COMPONENT
        );

        myInitializerRun++;
      });

      const sws: StackendWebSocket = store.dispatch(getInstance(community));
      expect(sws).toBeDefined();
      expect(myInitializerRun).toBe(1);
      await sleep(1000); // Allow connection to establish

      console.log(sws);

      const sws2 = store.dispatch(getInstance(community));
      expect(sws === sws2).toBeTruthy(); // Same instance
      expect(myInitializerRun).toBe(1);
    });

    it('getBroadcastIdentifier', async () => {
      const community: Community = store.getState().communities.community;
      const sws: StackendWebSocket = store.dispatch(getInstance(community));
      expect(sws._getBroadcastIdentifier()).toBe('*');
      expect(sws._getBroadcastIdentifier(StackendWebSocketEvent.MESSAGE_RECEIVED)).toBe(
        StackendWebSocketEvent.MESSAGE_RECEIVED
      );
      expect(sws._getBroadcastIdentifier(StackendWebSocketEvent.MESSAGE_RECEIVED, 'a', 'b')).toBe(
        StackendWebSocketEvent.MESSAGE_RECEIVED + '-a-b'
      );
    });

    it('ping', async () => {
      const community: Community = store.getState().communities.community;
      const sws: StackendWebSocket = store.dispatch(getInstance(community));
      sws.ping();
      await sleep(1000);
      expect(pongs).toBe(1);
    });

    it('subscribe/unsubscribe', async () => {
      const community: Community = store.getState().communities.community;
      const sws: StackendWebSocket = store.dispatch(getInstance(community));
      const sub = new CommentsSubscription('comments', 123);

      let n = 0;
      const listener: RealTimeListener = (message, payload) => {
        console.log('Real time message', message, payload);
        n++;
      };
      sws.subscribe(sub, listener);

      expect(Object.keys(sws.realTimeListeners).length).toBe(1);
      expect(sws.realTimeListeners[sub.getKey()]).toBeDefined();
      expect(sws.realTimeListeners[sub.getKey()][0]).toBe(listener);

      // Fake a message
      const payload: RealTimePayload = {
        component: sub.component,
        communityContext: sws.getXcapCommunityName() + ':' + sub.context,
        id: 456,
        referenceId: sub.referenceId,
        obfuscatedReference: null,
        type: 'Test',
        userId: 0
      };

      sws._broadcast(StackendWebSocketEvent.MESSAGE_RECEIVED, {} as Event, {
        messageType: 'OBJECT_MODIFIED',
        componentName: REALTIME_COMPONENT,
        communityContext: sws.getXcapCommunityName() + ':' + REALTIME_CONTEXT,
        payload: JSON.stringify(payload)
      });

      expect(n).toBe(1);
      sws.unsubscribe(sub, listener);
      expect(Object.keys(sws.realTimeListeners).length).toBe(0);
      expect(sws.realTimeListeners[sub.getKey()]).toBeUndefined();
    });

    it('subscribeMultiple/unsubscribeMultiple', async () => {
      const community: Community = store.getState().communities.community;
      const sws: StackendWebSocket = store.dispatch(getInstance(community));

      let n = 0;
      const listener: RealTimeListener = (message, payload) => {
        console.log('Real time message', message, payload);
        n++;
      };

      const references: Array<string> = ['abc123', 'abc456'];
      sws.subscribeMultiple(RealTimeFunctionName.LIKE, 'like', references, listener);

      expect(Object.keys(sws.realTimeListeners).length).toBe(2);
      const key = 'ref:' + RealTimeFunctionName.LIKE + ':abc123';
      expect(sws.realTimeListeners[key]).toBeDefined();
      expect(sws.realTimeListeners[key][0]).toBe(listener);

      // Fake a message
      const payload: RealTimePayload = {
        component: RealTimeFunctionName.LIKE,
        communityContext: sws.getXcapCommunityName() + ':like',
        id: 123,
        referenceId: 0,
        obfuscatedReference: 'abc123',
        type: COMMENT_CLASS,
        userId: 0
      };

      sws._broadcast(StackendWebSocketEvent.MESSAGE_RECEIVED, {} as Event, {
        messageType: 'OBJECT_MODIFIED',
        componentName: REALTIME_COMPONENT,
        communityContext: sws.getXcapCommunityName() + ':' + REALTIME_CONTEXT,
        payload: JSON.stringify(payload)
      });

      expect(n).toBe(1);
      sws.unsubscribeMultiple(RealTimeFunctionName.LIKE, 'like', references, listener);
      expect(Object.keys(sws.realTimeListeners).length).toBe(0);
      expect(sws.realTimeListeners[key]).toBeUndefined();
    });

    it('close', async () => {
      const community: Community = store.getState().communities.community;
      const sws: StackendWebSocket = store.dispatch(getInstance(community));
      sws.close();
    });
  });
});
