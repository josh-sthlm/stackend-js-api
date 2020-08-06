//@flow

import store from './setup-redux.js';

import { report } from '../src/abuse';

describe('Store', () => {
	describe('store', () => {
		it("Should contain Stackend basic values", () => {
			let state = store.getState();
			expect(state.currentUser).toBeDefined();
		})
	})
});


