//@flow

import store from './setup-redux';

describe('Store', () => {
	describe('store', () => {
		it("Should contain Stackend basic values", () => {
			let state = store.getState();
			expect(state.currentUser).toBeDefined();
		})
	})
});


