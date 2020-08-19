//@flow

import {
  Product,
  getProduct,
  listProducts,
  listProductTypes,
  listProductsAndTypes,
  GetProductRequest,
  ListProductsRequest,
  ListProductTypesResult,
  ListProductTypesRequest, ListProductsResult, ListProductsAndTypesResult, GetProductResult
} from '../shop';
import { ADD_TO_BASKET, RECEIVE_PRODUCT, RECEIVE_PRODUCT_TYPES, RECEIVE_PRODUCTS } from './shopReducer';
import { Thunk } from '../api';

export const requestProductTypes = (req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> => async (
  dispatch: any
): Promise<ListProductTypesResult> => {
  const r = await dispatch(listProductTypes(req));
  await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  return r;
};

export const requestProducts = (req: ListProductsRequest) => async (dispatch: any): Promise<ListProductsResult> => {
  const r = await dispatch(listProducts(req));
  await dispatch({ type: RECEIVE_PRODUCTS, json: r });
  return r;
};

export const requestProductsAndProductTypes = (req: ListProductsRequest) => async (dispatch: any): Promise<ListProductsAndTypesResult> => {
  const r = await dispatch(listProductsAndTypes(req));
  await dispatch({ type: RECEIVE_PRODUCTS, json: r });
  await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  return r;
};

export const requestProduct = (req: GetProductRequest) => async (dispatch: any): Promise<GetProductResult> => {
  const r = await dispatch(getProduct(req));
  await dispatch({ type: RECEIVE_PRODUCT, json: r });
  return r;
};

// FIXME: Should be product variant
export const addToBasket = (product: Product) => async (dispatch: any): Promise<void> => {
  await dispatch({ type: ADD_TO_BASKET, product });
};
