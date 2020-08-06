//@flow

import createTestStore from './setup-redux';

describe('Store', () => {
	describe('store', () => {
		it("Should contain Stackend basic values", () => {
			let store = createTestStore();
			let state = store.getState();
			expect(state.currentUser).toBeDefined();
		})
	})
});


