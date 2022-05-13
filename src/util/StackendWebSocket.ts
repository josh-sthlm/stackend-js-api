import SockJS from 'sockjs-client';
import { Config, Thunk } from '../api';
import { Community } from '../stackend';
import { parseCommunityContext } from '../api/CommunityContext';

export interface Message {
  communityContext: string;
  componentName: string;
  messageType: string;
  payload?: any; // Any type specific data
}

export type Listener = (type: StackendWebSocketEvent, event?: Event, message?: Message) => void;

export type RealTimeListener = (message: Message, payload: RealTimePayload) => void;

/**
 * Events
 */
export enum StackendWebSocketEvent {
  SOCKET_OPENING = 'socketOpening.ws',
  SOCKET_OPENED = 'socketOpened.ws',
  MESSAGE_RECEIVED = 'messageReceived.ws',
  SOCKET_CLOSED = 'socketClosed.ws',
  SOCKET_ERROR = 'socketError.ws'
}

/**
 * Functions that supports real time subscriptions
 */
export enum RealTimeFunctionName {
  COMMENT = 'comment',
  BLOG = 'blog',
  LIKE = 'like'
}

/**
 * Real time message types
 */
export enum RealTimeMessageType {
  PING = 'PING',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  UNSUBSCRIBE_ALL = 'UNSUBSCRIBE_ALL',
  PONG = 'PONG',
  OBJECT_CREATED = 'OBJECT_CREATED',
  OBJECT_MODIFIED = 'OBJECT_MODIFIED',
  OBJECT_REMOVED = 'OBJECT_REMOVED',
  ERROR = 'ERROR'
}

export abstract class Subscription {
  component: RealTimeFunctionName;
  context: string;
  referenceId: number;
  key: string;

  protected constructor(component: RealTimeFunctionName, context: string, referenceId: number) {
    if (!component) {
      throw 'Component is required';
    }
    if (!context) {
      throw 'context is required';
    }
    if (!referenceId) {
      throw 'referenceId is required';
    }
    this.component = component;
    this.context = context;
    this.referenceId = referenceId;

    this.key = 'sub:' + context + ':' + component + ':' + referenceId;
  }

  getKey(): string {
    return this.key;
  }
}

export class CommentsSubscription extends Subscription {
  constructor(context: string, referenceId: number) {
    super(RealTimeFunctionName.COMMENT, context, referenceId);
  }
}

export class BlogSubscription extends Subscription {
  constructor(context: string, blogId: number) {
    super(RealTimeFunctionName.BLOG, context, blogId);
  }
}

/**
 * The payload you can expect from a real time subscription
 */
export interface RealTimePayload {
  /** Community context */
  communityContext: string;

  /** Function name */
  component: RealTimeFunctionName;

  /** Object type */
  type: string;

  /** Object id */
  id: number;

  /** Obfuscated reference of object or null if not available */
  obfuscatedReference: string | null;

  /** Id of the user that modified the object*/
  userId: number;

  /** Reference id of (implementation dependant) */
  referenceId: number;

  /** Reference group id, if any (implementation dependant) */
  referenceGroupId?: number;

  /** Number of likes, if supported */
  likes: number | null;
}

/**
 * Component used for real time notifications about xcap object creation/editing/deletion
 * (a comment has been made in this collection of comments)
 */
export const REALTIME_COMPONENT = 'realtime';

/**
 * Context used for real time info
 */
export const REALTIME_CONTEXT = REALTIME_COMPONENT;

/**
 * Component used for FB style notifications (X has liked my post, Y has replied to my post ...)
 */
export const USER_NOTIFICATION_COMPONENT = 'usernotification';

/**
 * Context used for FB style notifications
 */
export const USER_NOTIFICATION_CONTEXT = 'notifications_site';

const DEFAULT_RECONNECT_DELAY = 10 * 1000;

/**
 * A web socket that is used to send and receive events from the stackend server.
 *
 * // Register your notification handler
 * addInitializer((sws: StackendWebSocket) => {
 *  sws.addListener((type, event, message) => {
 * 	  console.log("Got notification: ", type, event, data);
 *  }, StackendWebSocketEvent.MESSAGE_RECEIVED, communityContext, USER_NOTIFICATION_COMPONENT);
 * });
 *
 * // Get the global instance
 * const community: Community = ...;
 * const sws: StackendWebSocket = dispatch(getInstance(community.xcapCommunityName));
 *
 * // Request data from the server
 * sws.send({
 *  communityContext: "stackend:notifications_site",
 *  componentName: USER_NOTIFICATION_COMPONENT,
 *  messageType: "GET_NUMBER_OF_UNSEEN",
 *  });
 *
 * // Subscribe to real time object notifications
 * sws.subscribe(new CommentsSubscription("comments", 123), (message: Message, payload: RealTimePayload) => {
 *   console.log("Real time notification", message, payload);
 * });
 */
export default class StackendWebSocket {
  static DEFAULT_URL = '/spring/ws';

  xcapCommunityName: string;
  url: string;
  debug = false;
  hasConnected = false;
  socket: WebSocket | null = null;
  isOpen = false;
  sendQueue: Array<Message> = [];

  /** Low level listeners. maps from broadcast id to array of listeners */
  listeners: { [broadcastId: string]: Array<Listener> } = {};

  realTimeListeners: {
    [key: string]: Array<RealTimeListener>;
  } = {};

  reconnectTimer: NodeJS.Timeout | null = null;
  reconnectDelayMs: number = DEFAULT_RECONNECT_DELAY;

  /**
   * Construct a new web socket
   */
  constructor(community: Community, url: string | null | undefined) {
    this.xcapCommunityName = community.xcapCommunityName;
    this.url = url || '/' + community.permalink + StackendWebSocket.DEFAULT_URL;
  }

  getXcapCommunityName(): string {
    return this.xcapCommunityName;
  }

  /**
   * Enable / disable debugging
   * @param debug
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  /**
   * Connect
   */
  connect(): void {
    if (this.socket !== null) {
      return;
    }

    this._broadcast(StackendWebSocketEvent.SOCKET_OPENING);
    this.socket = new SockJS(this.url);
    this.socket.onopen = this._onOpen;
    this.socket.onmessage = this._onMessage;
    this.socket.onclose = this._onClose;
    this.socket.onerror = this._onError;
    this.hasConnected = true;
  }

  _onOpen = (): void => {
    this._broadcast(StackendWebSocketEvent.SOCKET_OPENED);
    this.isOpen = true;
    this.reconnectDelayMs = DEFAULT_RECONNECT_DELAY;
  };

  _onMessage = (m: MessageEvent): void => {
    const message: Message = JSON.parse(m.data);
    this._broadcast(StackendWebSocketEvent.MESSAGE_RECEIVED, m, message);
  };

  _onClose = (e: CloseEvent): void => {
    this._broadcast(StackendWebSocketEvent.SOCKET_CLOSED, e);
    if (this.isOpen) {
      // Not closed by api. Assume error
      this._scheduleReconnect();
    }
    this.isOpen = false;
  };

  _onError = (e: Event): void => {
    console.error('Stackend: WebSocket error: ', e);
    this._broadcast(StackendWebSocketEvent.SOCKET_ERROR, e);
    this._broadcast(StackendWebSocketEvent.SOCKET_CLOSED, e);
    this.isOpen = false;
    this._scheduleReconnect();
  };

  _scheduleReconnect = (): void => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(this._doReconnect, this.reconnectDelayMs) as any;
  };

  _doReconnect = (): void => {
    if (this.isOpen) {
      return;
    }

    console.debug('Stackend: WebSocket reconnecting');
    this.socket?.close(); // May cause _onError to be invoked
    this.socket = null;
    // Double the retry delay every time it fails
    this.reconnectDelayMs = 2 * this.reconnectDelayMs;
    this.connect();
  };

  close(): void {
    this.isOpen = false;
    this.socket?.close();
    delete instances[this.xcapCommunityName];
  }

  validateMessage(message: Message): void {
    if (!message) {
      throw 'No message';
    }

    if (!message.messageType) {
      throw 'messageType required: ' + JSON.stringify(message);
    }

    if (!message.componentName) {
      throw 'componentName required: ' + +JSON.stringify(message);
    }

    if (
      !message.communityContext ||
      message.communityContext.startsWith('undefined:') ||
      message.communityContext.endsWith(':undefined')
    ) {
      throw 'communityContext required: ' + +JSON.stringify(message);
    }
  }

  /**
   * Send a message
   * @param message
   */
  send(message: Message): void {
    this.validateMessage(message);

    if (this.debug) {
      console.log('send, hasConnected: ' + this.hasConnected);
    }

    // FIXME: Queue or fail
    if (!this.hasConnected) {
      return;
    }

    this.sendQueue.push(message);
    this._sendInternal();
  }

  /**
   * Send a ping
   */
  ping(): void {
    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.PING
    });
  }

  _addRealTimeListenerForSubscription(subscription: Subscription, listener: RealTimeListener): boolean {
    return this._addRealTimeListener(subscription.getKey(), listener);
  }

  _addRealTimeListenerForReference(
    component: RealTimeFunctionName,
    obfuscatedReference: string,
    listener: RealTimeListener
  ): boolean {
    const key = this._getReferenceKey(component, obfuscatedReference);
    return this._addRealTimeListener(key, listener);
  }

  _getReferenceKey(component: RealTimeFunctionName, obfuscatedReference: string): string {
    return 'ref:' + component + ':' + obfuscatedReference;
  }

  _addRealTimeListener(key: string, listener: RealTimeListener): boolean {
    let listeners = this.realTimeListeners[key];
    if (!listeners) {
      listeners = [];
      this.realTimeListeners[key] = listeners;
    }

    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
      return true;
    }

    return false;
  }

  _removeRealTimeListener(key: string, listener: RealTimeListener): boolean {
    const listeners = this.realTimeListeners[key];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const l = listeners[i];
        if (l === listener) {
          listeners.splice(i, 1);
          if (listeners.length === 0) {
            delete this.realTimeListeners[key];
          }
          return true;
        }
      }
    }
    return false;
  }

  _removeRealTimeListenerForSubscription(subscription: Subscription, listener: RealTimeListener): boolean {
    return this._removeRealTimeListener(subscription.getKey(), listener);
  }

  _removeRealTimeListenerForReference(
    component: RealTimeFunctionName,
    obfuscatedReference: string,
    listener: RealTimeListener
  ): boolean {
    const key = this._getReferenceKey(component, obfuscatedReference);
    return this._removeRealTimeListener(key, listener);
  }

  _removeAllRealTimeListeners(context?: string): number {
    if (!context) {
      const n = Object.keys(this.realTimeListeners).length;
      this.realTimeListeners = {};
      return n;
    }

    const subRe = new RegExp('^sub:' + context + ':.*');
    const refRe = new RegExp('^ref:[^:]+:' + context + ':.*');

    let n = 0;
    for (const key of Object.keys(this.realTimeListeners)) {
      const l = this.realTimeListeners[key];
      if (subRe.test(key) || refRe.test(key)) {
        if (l) {
          n += l.length;
        }
        delete this.realTimeListeners[key];
      }
    }

    return n;
  }

  /**
   * Subscribe to object creation/modification/deletion notifications
   * @param subscription
   * @param listener
   */
  subscribe(subscription: Subscription, listener: RealTimeListener): void {
    this._addRealTimeListenerForSubscription(subscription, listener);
    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.SUBSCRIBE,
      payload: {
        function: subscription.component,
        context: subscription.context,
        referenceId: subscription.referenceId
      }
    });
  }

  /**
   * Subscribe to a set of references
   * @param component
   * @param context
   * @param obfuscatedReferences
   * @param listener
   */
  subscribeMultiple(
    component: RealTimeFunctionName,
    context: string,
    obfuscatedReferences: Array<string>,
    listener: RealTimeListener
  ): void {
    obfuscatedReferences.forEach(r => {
      this._addRealTimeListenerForReference(component, r, listener);
    });

    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.SUBSCRIBE,
      payload: {
        function: component,
        context: context,
        references: obfuscatedReferences
      }
    });
  }

  /**
   * Unsubscribe from object creation/modification/deletion notifications
   * @param subscription
   * @param listener
   */
  unsubscribe(subscription: Subscription, listener: RealTimeListener): void {
    this._removeRealTimeListenerForSubscription(subscription, listener);
    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.UNSUBSCRIBE,
      payload: {
        function: subscription.component,
        context: subscription.context,
        referenceId: subscription.referenceId
      }
    });
  }

  /**
   * Unsubscribe from a set of references
   * @param component
   * @param context
   * @param obfuscatedReferences
   * @param listener
   */
  unsubscribeMultiple(
    component: RealTimeFunctionName,
    context: string,
    obfuscatedReferences: Array<string>,
    listener: RealTimeListener
  ): void {
    obfuscatedReferences.forEach(r => {
      this._removeRealTimeListenerForReference(component, r, listener);
    });
    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.UNSUBSCRIBE,
      payload: {
        function: component,
        context: context,
        references: obfuscatedReferences
      }
    });
  }

  /**
   * Unsubscribe from all real time notifications
   * @param context
   */
  unsubscribeAll(context?: string): void {
    if (!context) throw 'context must be supplied';
    this._removeAllRealTimeListeners(context);
    this.send({
      communityContext: this.xcapCommunityName + ':' + REALTIME_COMPONENT,
      componentName: REALTIME_COMPONENT,
      messageType: RealTimeMessageType.UNSUBSCRIBE_ALL,
      payload: {
        context
      }
    });
  }

  /**
   * Get a broadcast identifier.
   * @param type
   * @param context
   * @param componentName
   * @returns {string}
   */
  _getBroadcastIdentifier(
    type?: StackendWebSocketEvent | null | undefined,
    context?: string | null | undefined,
    componentName?: string | null | undefined
  ): string {
    let key = '';

    if (type) {
      key += type;
    } else {
      key = '*';
    }

    if (context) {
      if (componentName) {
        key += '-' + context + '-' + componentName;
      } else {
        throw 'Both context and componentName must be specified';
      }
    }

    return key;
  }

  _sendInternal(): void {
    if (this.socket && this.isOpen && this.sendQueue.length > 0) {
      while (this.sendQueue.length > 0) {
        const message = this.sendQueue.shift();

        const x = { ...message };
        if (x) {
          if (x.payload) {
            // FIXME: This double encoding is stupid
            x.payload = JSON.stringify(x.payload);
          }
          if (this.debug) {
            console.log('Sending message:', x);
          }
          this.socket.send(JSON.stringify(x));
        }
      }
    } else {
      setTimeout(() => {
        this._sendInternal();
      }, 1000);
    }
  }

  /**
   * Call all listeners that matches
   * @param type
   * @param message
   * @param event
   */
  _broadcast(type: StackendWebSocketEvent, event?: Event, message?: Message): void {
    let identifier = null;
    if (message) {
      const cc = parseCommunityContext(message?.communityContext);
      identifier = this._getBroadcastIdentifier(type, cc?.context, message.componentName);
    } else {
      identifier = this._getBroadcastIdentifier(type);
    }

    if (this.debug) {
      console.log('Broadcasting', type, identifier, message);
    }

    const a = this.listeners[identifier];
    let n = 0;
    if (a) {
      a.forEach(f => {
        n++;
        f(type, event, message);
      });
    }

    // Catch all listener
    const b = this.listeners['*'];
    if (b) {
      b.forEach(f => {
        n++;
        f(type, event, message);
      });
    }

    // Real time listeners
    if (message != null && type === StackendWebSocketEvent.MESSAGE_RECEIVED) {
      switch (message.messageType) {
        case RealTimeMessageType.OBJECT_CREATED:
        case RealTimeMessageType.OBJECT_MODIFIED:
        case RealTimeMessageType.OBJECT_REMOVED: {
          const payload: RealTimePayload = JSON.parse(message.payload);
          const subKey = this._getSubscriptionKey(payload);
          const listeners = this.realTimeListeners[subKey];
          if (listeners) {
            listeners.forEach(l => {
              n++;
              l(message, payload);
            });
          }

          if (payload.obfuscatedReference) {
            const refKey = this._getReferenceKey(payload.component, payload.obfuscatedReference);
            const listeners = this.realTimeListeners[refKey];
            if (listeners) {
              listeners.forEach(l => {
                n++;
                l(message, payload);
              });
            }
          }

          break;
        }
        default:
          break;
      }
    }

    if (this.debug) {
      console.log(type, identifier + ' delivered to ' + n + ' listeners');
    }
  }

  _getSubscriptionKey(payload: RealTimePayload): string {
    // Should be context + ':' + component + ':' + referenceId;
    const cc = parseCommunityContext(payload.communityContext);
    return 'sub:' + cc?.context + ':' + payload.component + ':' + payload.referenceId;
  }

  /**
   * Add a listener that receives broadcasts.
   * For a catch all listener: sws.addListener(listener);
   * To a catch a specific event in all contexts: sws.addListener(listener, StackendWebSocketEvent.SOCKET_CLOSED);
   * To catch events for specific components ws.addListener(listener, StackendWebSocketEvent.MESSAGE_RECEIVED, 'stackend:notifications_site', 'usernotification');
   *
   * @param listener: Listener
   * @param type
   * @param communityContext as returned by getBroadcastIdentifier
   * @param componentName
   */
  addListener(
    listener: Listener,
    type?: StackendWebSocketEvent,
    communityContext?: string,
    componentName?: string
  ): void {
    if (typeof listener !== 'function') {
      throw 'Listener must be a function';
    }
    const broadcastIdentifier = this._getBroadcastIdentifier(type, communityContext, componentName);

    let a = this.listeners[broadcastIdentifier];
    if (!a) {
      a = [];
      this.listeners[broadcastIdentifier] = a;
    }

    a.push(listener);
  }

  /**
   * Short hand for adding a listener for StackendWebSocketEvent.MESSAGE_RECEIVED
   * @param listener
   * @param communityContext
   * @param componentName
   */
  addMessageListener(listener: Listener, communityContext?: string, componentName?: string): void {
    this.addListener(listener, StackendWebSocketEvent.MESSAGE_RECEIVED, communityContext, componentName);
  }
}

const instances: { [xcapCommunityName: string]: StackendWebSocket } = {};
const initializers: Array<any> = [];

export type Initializer = (stackendWebSocket: StackendWebSocket) => void;

/**
 * Add a global initializer used when getInstance() creates a StackendWebSocket
 * @param initializer
 */
export function addInitializer(initializer: Initializer): void {
  initializers.push(initializer);
}

/**
 * Remove an initializer
 * @param initializer
 */
export function removeInitializer(initializer: Initializer): boolean {
  for (let i = 0; i < initializers.length; i++) {
    const init = initializers[i];
    if (init === initializer) {
      initializers.splice(i, 1);
      return true;
    }
    initializers.push(initializer);
  }
  return false;
}

/**
 * Get the community instance. All registered initializers are run
 */
export function getInstance(community: Community): Thunk<StackendWebSocket> {
  return (dispatch, getState): StackendWebSocket => {
    if (!community?.id) throw 'Community required';

    let instance: StackendWebSocket = instances[community.xcapCommunityName];

    if (!instance) {
      const config: Config = getState().config;
      const url = config.server + config.contextPath + '/' + community.permalink + StackendWebSocket.DEFAULT_URL;
      console.debug('Stackend: Creating StackendWebSocket for ' + community.xcapCommunityName + ', ' + url);
      const sws = new StackendWebSocket(community, url);
      for (const init of initializers) {
        init(sws);
      }
      sws.connect();
      instances[community.xcapCommunityName] = sws;
      instance = sws;
    }

    return instance;
  };
}

/**
 * Shut down and remove the community instance
 */
export function removeInstance(xcapCommunityName: string): boolean {
  const instance: StackendWebSocket = instances[xcapCommunityName];
  if (instance) {
    instance.close();
    delete instances[xcapCommunityName];
    return true;
  }

  return false;
}

/**
 * Remove all instances
 */
export function removeAll(): number {
  let n = 0;
  for (const xcapCommunityName of Object.keys(instances)) {
    if (removeInstance(xcapCommunityName)) {
      n++;
    }
  }
  return n;
}
