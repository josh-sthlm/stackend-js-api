//@flow

//Action Type

import { type GraphQLList, type Product } from './shop.js';
import _ from 'lodash';

export const RECIEVE_PRODUCT_TYPES: string = 'RECIEVE_PRODUCT_TYPES';
export const RECIEVE_PRODUCT: string = 'RECIEVE_PRODUCT';
export const RECIEVE_PRODUCTS: string = 'RECIEVE_PRODUCTS';
export const ADD_TO_BASKET: string = 'ADD_TO_BASKET';
export const REMOVE_FROM_BASKET: string = 'REMOVE_FROM_BASKET';

export const DEFAULT_PRODUCT_TYPE: string = '';

export type ShopState = {
	productTypes: Array<string>,
	products: {
		[handle: string]: Product
	},
	productsByType: {
		[productType: string]: GraphQLList<Product>
	},
	basket: []
};

export default function shopReducer(
	state: ShopState = {
		productTypes: [],
		products: {},
		productsByType: {},
		basket: []
	},
	action: {
		type: string,
		receievedAt?: number,
		json?: any
	}
) {
	switch (action.type) {
		case RECIEVE_PRODUCT_TYPES: {
			let edges = _.get(action, 'json.productTypes.edges', []);
			let productTypes = edges.map(e => e.node);
			return Object.assign({}, state, {
				productTypes
			});
		}

		case RECIEVE_PRODUCT: {
			let product = _.get(action, 'json.product');
			if (product) {
				let products = Object.assign({}, state.products, {
					[product.handle]: product
				});

				return Object.assign({}, state, {
					products
				});
			}
			break;
		}

		case RECIEVE_PRODUCTS: {
			let products = _.get(action, 'json.products');
			let productType = DEFAULT_PRODUCT_TYPE; // FIXME: Get requested type from backend

			// FIXME: Pagination
			state.productsByType[productType] = products;

			let productsByType = Object.assign({}, state.productsByType, {
				[productType]: products
			});

			return Object.assign({}, state, {
				productsByType
			});
		}

		case ADD_TO_BASKET: {
			let basket = [...state.basket];
			basket.push(action.product);

			return Object.assign({}, state, {
				basket
			});
		}
	}

	return state;
}
