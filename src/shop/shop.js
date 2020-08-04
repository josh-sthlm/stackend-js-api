//@flow

import { type Thunk } from '../store.js';
import { getJson, post, type XcapJsonResult } from '../api.js';

export type GraphQLListNode<T> = {
	node: T
};
export type GraphQLList<T> = {
	edges: Array<GraphQLListNode<T>>
};

export type ProductImage = {
	id: string,
	altText: ?string,
	transformedSrc: string
};

export type Product = {
	id: string,
	/** permalink */
	handle: string,
	title: string,
	description: string,
	/** Format: "2019-07-11T14:09:26Z" */
	updatedAt: string,
	/** Format: "2019-07-11T14:09:26Z" */
	createdAt: string,
	availableForSale: boolean,
	/** Actual number of images and size depends on context/listing */
	images: GraphQLList<ProductImage>
};

/**
 * Get the shop configuration. Requires admin privs
 * @returns {Thunk<XcapJsonResult>}
 */
export function getShopConfiguration(): Thunk<XcapJsonResult> {
	return getJson({
		url: '/shop/admin/get-config'
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
	storeFrontAccessToken
}: {
	shop: ?string,
	storeFrontAccessToken: ?string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/shop/admin/store-config',
		parameters: arguments
	});
}

export type ListProductTypesRequest = {
	first?: number
};

export type ListProductTypesResult = XcapJsonResult & {
	productTypes: GraphQLList<string>
};

/**
 * List product types
 * @param req
 * @returns {Thunk<ListProductTypesResult>}
 */
export function listProductTypes(req: ListProductTypesRequest): Thunk<ListProductTypesResult> {
	return getJson({
		url: '/shop/list-product-types',
		parameters: arguments
	});
}

export const ProductSortKeys = {
	RELEVANCE: 'RELEVANCE'
};

export type ListProductsRequest = {
	q?: string,
	productTypes?: Array<string>,
	tags?: Array<string>,
	first?: Number,
	after?: string,
	sort?: $Values<ProductSortKeys>
};

export type ListProductsResult = XcapJsonResult & {
	products: GraphQLList<Product>
};

/**
 * List products
 * @param req
 * @returns {Thunk<ListProductsResult>}
 */
export function listProducts(req: ListProductsRequest): Thunk<ListProductsResult> {
	return getJson({
		url: '/shop/list-products',
		parameters: arguments
	});
}

export type GetProductRequest = {
	handle: string
};

export type GetProductResult = {
	product: ?Product
};

/**
 * Get a single product
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getProduct(req: GetProductRequest): Thunk<GetProductResult> {
	return getJson({
		url: '/shop/get-product',
		parameters: arguments
	});
}

export type ListProductsAndTypesResult = ListProductsResult & {
	productTypes: GraphQLList<string>
};

/**
 * List products and types
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function listProductsAndTypes(req: ListProductsRequest): Thunk<ListProductsAndTypesResult> {
	return getJson({
		url: '/shop/list-products-and-types',
		parameters: arguments
	});
}

export function getFirstImage(product: ?Product): ?ProductImage {
	if (!product) {
		return null;
	}

	let images = product.images;
	if (!images || images.edges.length === 0) {
		return null;
	}

	return images.edges[0].node;
}

export type ProductTypeTree = {
	name: string,
	children?: Array<ProductTypeTree>
};

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
export function constructProductTypeTree(productTypes: GraphQLList<string>): ProductTypeTree {
	if (!productTypes) {
		return null;
	}

	let t: ProductTypeTree = {
		name: ''
	};

	if (productTypes.edges.length !== 0) {
		t.children = [];

		productTypes.edges.forEach(p => {
			let name = p.node;
			if (name === '') {
				return;
			}
			_addNode(t, name);
		});
	}

	return t;
}

function _addNode(root: ProductTypeTree, name: string): ProductTypeTree {
	let parts = name.split(/\s*[/;]\s*/);

	let t: ProductTypeTree = {
		name: parts[parts.length - 1]
	};

	_createNodes(root, parts);

	return t;
}

function _createNodes(root: ProductTypeTree, parts: Array<string>): ?ProductTypeTree {
	if (parts.length === 0) {
		return null;
	}

	let name = parts[0];

	let t: ProductTypeTree = {
		name
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

	let remainigParts = parts.slice(1);
	return _createNodes(match, remainigParts);
}
