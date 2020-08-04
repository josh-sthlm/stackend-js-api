//@flow
import * as reducer from './notificationReducer.js';
import * as Notifications from './notifications.js';
import { type Thunk } from '../types/store.js';
import XcapWebSocket from '../xcap/websocket.js';
import { getXcapWebSocket } from '../xcap/WebSocketFactory.js';

declare var $: any; // Jquery for websockets

export function receiveNotifications({
	notifications,
	senderCounts
}: {
	notifications: Array<Notifications.Notification>,
	senderCounts: {}
}) {
	return {
		type: reducer.RECEIVE_NOTIFICATIONS,
		notifications,
		senderCounts
	};
}

export function requestNotifications() {
	return { type: reducer.REQUEST_NOTIFICATIONS };
}

export function receiveNotificationCounts({ numberOfUnseen }: { numberOfUnseen: number }) {
	return {
		type: reducer.RECEIVE_NOTIFICATION_COUNTS,
		numberOfUnseen
	};
}

/**
 * List notifications
 * @param p
 * @param pageSize
 * @returns {function(any, any)}
 */
export function listNotifications({ p, pageSize }: { p?: number, pageSize?: number }): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		try {
			dispatch(requestNotifications());

			const json = await dispatch(Notifications.listNotifications({ page: p, pageSize }));

			return dispatch(receiveNotifications(json));
		} catch (e) {
			console.log('Error loading notifications', e);
		}
	};
}

/**
 * Mark a notification as read and refresh the notification list
 * @param id
 * @returns {function(any, any)}
 */
export function markAsRead({ id }: { id: number }): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		await dispatch(Notifications.markAsRead({ id }));
		dispatch(listNotifications({}));
	};
}

let webSocket: XcapWebSocket = null;

/**
 * Start the notification web socket (client side only)
 */
export function startNotificationWebSocketClientSide({
	communityContext
}: {
	communityContext: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		let xcapCommunityName = communityContext.split(':')[0];
		webSocket = await dispatch(getXcapWebSocket({ xcapCommunityName, config: getState().config }));

		// Ensure we initialize server side by making a request
		webSocket.send(communityContext, 'usernotification', 'GET_NUMBER_OF_UNSEEN', '');
	};
}

/**
 * Web socket listener
 */
export function numberOfUnseenWebSocketListener(event, data): Thunk<*> {
	return (dispatch: any, getState: any) => {
		switch (data.messageType) {
			case 'NUMBER_OF_UNSEEN':
				const payload = JSON.parse(data.payload);

				let { notifications } = getState();

				let update =
					notifications.numberOfUnseen !== payload.numberOfUnseen ||
					notifications.notifications.length === 0;

				// FIXME: Hack. This number is not trustworthy
				//dispatch(receiveNotificationCounts(payload));

				// Fetch notifications when needed
				if (update) {
					dispatch(listNotifications({}));
				}

				break;
			default:
				break;
		}
	};
}

/**
 * Stop the notification web socket (client side only)
 */
export function stopNotificationWebSocketClientSide({
	communityContext
}: {
	communityContext: string
}): Thunk<*> {
	return (dispatch: any, getState: any) => {
		// FIXME: Implement this
		//webSocket.close();
	};
}
