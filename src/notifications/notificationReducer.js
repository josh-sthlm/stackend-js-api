//@flow
import { listNotifications, type Notification } from './notifications.js';
import update from 'immutability-helper';

export const REQUEST_NOTIFICATIONS = 'REQUEST_NOTIFICATIONS';
export const RECEIVE_NOTIFICATIONS = 'RECEIVE_NOTIFICATIONS';
export const RECEIVE_NOTIFICATION_COUNTS = 'RECEIVE_NOTIFICATION_COUNTS';

export type State = {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: number,
	numberOfUnseen: number,
	notifications: Array<Notification>,
	senderCounts: {
		/* Map from notification id to number*/
	},
	p: number,
	pageSize: number
};

const initialState: State = {
	isFetching: false,
	didInvalidate: false,
	lastUpdated: Date.now(),
	numberOfUnseen: 0,
	notifications: [],
	senderCounts: {},
	p: 1,
	pageSize: 20
};

export type Action =
	| { type: 'REQUEST_NOTIFICATIONS' }
	| {
			type: 'RECEIVE_NOTIFICATION_COUNTS',
			numberOfUnseen: number
	  }
	| {
			type: 'RECIEVE_NOTIFICATIONS',
			notifications: Array<Notification>,
			senderCounts: {},
			p: number,
			pageSize: number
	  };

export default function notifications(state: State = initialState, action: Action) {
	switch (action.type) {
		case REQUEST_NOTIFICATIONS:
			return update(state, {
				isFetching: { $set: true },
				didInvalidate: { $set: false }
			});

		case RECEIVE_NOTIFICATIONS:
			// Trust this value rather than the websocket
			let numberOfUnseen = 0;
			if (action.notifications) {
				action.notifications.forEach(n => {
					if (n.status === 0) {
						numberOfUnseen++;
					}
				});
			}

			return update(state, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: Date.now() },
				notifications: { $set: action.notifications || [] },
				senderCounts: { $set: action.senderCounts || {} },
				p: { $set: action.p || 1 },
				pageSize: { $set: action.pageSize || state.pageSize },
				numberOfUnseen: { $set: numberOfUnseen }
			});

		case RECEIVE_NOTIFICATION_COUNTS:
			return update(state, {
				numberOfUnseen: { $set: action.numberOfUnseen }
			});

		default:
			return state;
	}
}
