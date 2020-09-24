//@flow

import { getJson, post, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';

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
export function getShopConfiguration(): Thunk<Promise<XcapJsonResult>> {
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
  shop: string | null;
  storeFrontAccessToken: string | null;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/shop/admin/store-config',
    parameters: arguments
  });
}

export interface ListProductTypesRequest extends XcapOptionalParameters {
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
export function listProductTypes(req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> {
  return getJson({
    url: '/shop/list-product-types',
    parameters: arguments
  });
}

export enum ProductSortKeys {
  VENDOR = 'VENDOR',
  CREATED_AT = 'CREATED_AT',
  ID = 'ID',
  PRICE = 'PRICE',
  PRODUCT_TYPE = 'PRODUCT_TYPE',
  RELEVANCE = 'RELEVANCE',
  TITLE = 'TITLE',
  UPDATED_AT = 'UPDATED_AT',
  BEST_SELLING = 'BEST_SELLING'
}

export interface ListProductsRequest extends XcapOptionalParameters {
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
export function listProducts(req: ListProductsRequest): Thunk<Promise<ListProductsResult>> {
  return getJson({
    url: '/shop/list-products',
    parameters: arguments
  });
}

export interface GetProductRequest extends XcapOptionalParameters {
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
export function getProduct(req: GetProductRequest): Thunk<Promise<GetProductResult>> {
  return getJson({
    url: '/shop/get-product',
    parameters: arguments
  });
}

export interface GetProductsRequest extends XcapOptionalParameters {
  handles: Array<string>;
}

export interface GetProductsResult extends XcapJsonResult {
  products: {
    [handle: string]: Product;
  };
}

/**
 * Get multiple products
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getProducts(req: GetProductsRequest): Thunk<Promise<GetProductsResult>> {
  return getJson({
    url: '/shop/get-products',
    parameters: arguments
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
export function listProductsAndTypes(req: ListProductsRequest): Thunk<Promise<ListProductsAndTypesResult>> {
  return getJson({
    url: '/shop/list-products-and-types',
    parameters: arguments
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

export class BasketItem {
  public readonly handle: string;
  public readonly variant: string | undefined;
  public quantity: number;

  constructor(handle: string, variant?: string, quantity?: number) {
    this.handle = handle;
    this.quantity = quantity || 1;
    this.variant = variant;
  }

  matches(handle: string, variant?: string): boolean {
    return handle === this.handle && variant === this.variant;
  }

  static COMPARATOR = (a: BasketItem, b: BasketItem): number => {
    const i = a.handle.localeCompare(b.handle);
    if (i !== 0) {
      return i;
    }

    if (a.variant) {
      if (b.variant) return a.variant.localeCompare(b.variant);
      return 1;
    } else {
      if (b.variant) return -1;
    }

    return 0;
  };
}

export class Basket {
  public readonly items: Array<BasketItem>;

  constructor() {
    this.items = [];
  }

  /**
   * Find a basket item
   * @param handle
   * @param variant
   */
  find(handle: string, variant?: string): BasketItem | null {
    for (const i of this.items) {
      if (i.matches(handle, variant)) {
        return i;
      }
    }
    return null;
  }

  /**
   * Add an item
   * @param handle
   * @param variant
   * @param quantity
   */
  add(handle: string, variant?: string, quantity?: number): number {
    const q = quantity || 1;
    let i = this.find(handle, variant);
    if (i) {
      i.quantity += q;
      return i.quantity;
    }

    i = new BasketItem(handle, variant, q);
    this.items.push(i);
    this.items.sort(BasketItem.COMPARATOR);
    return q;
  }

  /**
   * Remove an item
   * @param handle
   * @param variant
   * @param quantity
   */
  remove(handle: string, variant?: string, quantity?: number): number {
    const q = quantity || 1;

    for (let i = 0; i < this.items.length; i++) {
      const x = this.items[i];
      if (x.matches(handle, variant)) {
        x.quantity -= q;
        if (x.quantity > 0) {
          return x.quantity;
        }
        this.items.splice(i, 1);
      }
    }

    return 0;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  static fromString(s: string): Basket {
    if (!s) {
      return new Basket();
    }

    const json: any = JSON.parse(s);
    const b = new Basket();
    if (json.items) {
      for (const i of json.items) {
        if (i.handle) {
          const bi = new BasketItem(i.handle, i.variant, i.quantity);
          b.items.push(bi);
        }
      }

      b.items.sort(BasketItem.COMPARATOR);
    }

    return b;
  }
}
