//@flow

import { getJson, post, XcapJsonResult, Thunk } from './api';

export interface GraphQLListNode<T> {
  node: T;
}

export interface GraphQLList<T> {
  edges: Array<GraphQLListNode<T>>;
}

export interface ProductImage {
  id: string;
  altText: string | null;
  transformedSrc: string;
}

export interface Product {
  id: string;
  /** permalink */
  handle: string;
  title: string;
  description: string;
  /** Format: "2019-07-11T14:09:26Z" */
  updatedAt: string;
  /** Format: "2019-07-11T14:09:26Z" */
  createdAt: string;
  availableForSale: boolean;
  /** Actual number of images and size depends on context/listing */
  images: GraphQLList<ProductImage>;
}

/**
 * Get the shop configuration. Requires admin privs
 * @returns {Thunk<XcapJsonResult>}
 */
export function getShopConfiguration(): Thunk<XcapJsonResult> {
  return getJson({
    url: '/shop/admin/get-config',
  });
}

/**
 * Store the shop configuration. Requires admin privs
 * @param shop
 * @param storeFrontAccessToken
 * @returns {Thunk<XcapJsonResult>}
 */
export function storeShopConfiguration({
  shop,
  storeFrontAccessToken,
}: {
  shop: string | null;
  storeFrontAccessToken: string | null;
}): Thunk<XcapJsonResult> {
  return post({
    url: '/shop/admin/store-config',
    parameters: arguments,
  });
}

export interface ListProductTypesRequest {
  first?: number;
}

export interface ListProductTypesResult extends XcapJsonResult {
  productTypes: GraphQLList<string>;
}

/**
 * List product types
 * @param req
 * @returns {Thunk<ListProductTypesResult>}
 */
export function listProductTypes(
  req: ListProductTypesRequest
): Thunk<ListProductTypesResult> {
  return getJson({
    url: '/shop/list-product-types',
    parameters: arguments,
  });
}

export enum ProductSortKeys {
  RELEVANCE = 'RELEVANCE',
}

export interface ListProductsRequest {
  q?: string;
  productTypes?: Array<string>;
  tags?: Array<string>;
  first?: number;
  after?: string;
  sort?: ProductSortKeys;
}

export interface ListProductsResult extends XcapJsonResult {
  products: GraphQLList<Product>;
}

/**
 * List products
 * @param req
 * @returns {Thunk<ListProductsResult>}
 */
export function listProducts(
  req: ListProductsRequest
): Thunk<ListProductsResult> {
  return getJson({
    url: '/shop/list-products',
    parameters: arguments,
  });
}

export interface GetProductRequest {
  handle: string;
}

export interface GetProductResult extends XcapJsonResult {
  product: Product | null;
}

/**
 * Get a single product
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getProduct(req: GetProductRequest): Thunk<GetProductResult> {
  return getJson({
    url: '/shop/get-product',
    parameters: arguments,
  });
}

export interface ListProductsAndTypesResult extends ListProductsResult {
  productTypes: GraphQLList<string>;
}

/**
 * List products and types
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function listProductsAndTypes(
  req: ListProductsRequest
): Thunk<ListProductsAndTypesResult> {
  return getJson({
    url: '/shop/list-products-and-types',
    parameters: arguments,
  });
}

export function getFirstImage(product: Product | null): ProductImage | null {
  if (!product) {
    return null;
  }

  const images = product.images;
  if (!images || images.edges.length === 0) {
    return null;
  }

  return images.edges[0].node;
}

export interface ProductTypeTree {
  name: string;
  children?: Array<ProductTypeTree>;
}


function _createNodes(
  root: ProductTypeTree,
  parts: Array<string>
): ProductTypeTree | null {
  if (parts.length === 0) {
    return null;
  }

  const name = parts[0];

  const t: ProductTypeTree = {
    name,
  };

  let match = null;
  if (root.children) {
    match = root.children.find(c => c.name === name);
  }

  if (!match) {
    match = root;
  }

  if (!match.children) {
    match.children = [];
  }
  match.children.push(t);

  if (parts.length === 1) {
    return t;
  }

  const remainingParts = parts.slice(1);
  return _createNodes(match, remainingParts);
}


function _addNode(root: ProductTypeTree, name: string): ProductTypeTree {
  const parts = name.split(/\s*[/;]\s*/);

  const t: ProductTypeTree = {
    name: parts[parts.length - 1],
  };

  _createNodes(root, parts);

  return t;
}

/**
 * Given a flat list with product types, construct a tree structure from the labels:
 *
 * Hockey
 * Hockey / Pucks
 * Soccer
 * Soccer / Balls
 *
 * @param productTypes
 * @returns {null}
 */
export function constructProductTypeTree(
  productTypes: GraphQLList<string>
): ProductTypeTree | null {
  if (!productTypes) {
    return null;
  }

  const t: ProductTypeTree = {
    name: '',
  };

  if (productTypes.edges.length !== 0) {
    t.children = [];

    productTypes.edges.forEach(p => {
      const name = p.node;
      if (name === '') {
        return;
      }
      _addNode(t, name);
    });
  }

  return t;
}


