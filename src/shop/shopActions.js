//@flow

import {
	getProduct,
	listProducts,
	listProductTypes,
	listProductsAndTypes,
	type GetProductRequest,
	type ListProductsRequest,
	type ListProductTypesResult
} from './shop.js';
import {
	ADD_TO_BASKET,
	RECIEVE_PRODUCT,
	RECIEVE_PRODUCT_TYPES,
	RECIEVE_PRODUCTS
} from './shopReducer.js';
import type { Product } from './shop.js';

export const requestProductTypes = (req: ListProductTypesResult) => async dispatch => {
	let r = await dispatch(listProductTypes(req));
	await dispatch({ type: RECIEVE_PRODUCT_TYPES, json: r });
	return r;
};

export const requestProducts = (req: ListProductsRequest) => async dispatch => {
	let r = await dispatch(listProducts(req));
	await dispatch({ type: RECIEVE_PRODUCTS, json: r });
	return r;
};

export const requestProductsAndProductTypes = (req: ListProductsRequest) => async dispatch => {
	let r = await dispatch(listProductsAndTypes(req));
	await dispatch({ type: RECIEVE_PRODUCTS, json: r });
	await dispatch({ type: RECIEVE_PRODUCT_TYPES, json: r });
	return r;
};

export const requestProduct = (req: GetProductRequest) => async dispatch => {
	let r = await dispatch(getProduct(req));
	await dispatch({ type: RECIEVE_PRODUCT, json: r });
	return r;
};

// FIXME: Should be product variant
export const addToBasket = (product: Product) => async dispatch => {
	await dispatch({ type: ADD_TO_BASKET, product });
};
