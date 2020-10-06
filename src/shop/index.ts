//@flow

import { getJson, post, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';
import { ShopState } from './shopReducer';

export interface GraphQLListNode<T> {
  node: T;
}

export interface GraphQLList<T> {
  edges: Array<GraphQLListNode<T>>;
}

export interface PaginatedGraphQLListNode<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedGraphQLList<T> {
  edges: Array<PaginatedGraphQLListNode<T>>;
  pageInfo: PageInfo;
}

export interface ProductImage {
  altText: string | null;
  transformedSrc: string;
}

export interface PriceV2 {
  amount: number;
  currencyCode: string;
}

/**
 * Options for the product: size, color etc
 */
export interface ProductOption {
  id: string;
  name: string;
  values: Array<string>;
}

/**
 * A variant of a product
 */
export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  sku: string;
  image: ProductImage | null;
  priceV2: PriceV2;
}

/**
 * A product, including variants
 */
export interface Product {
  id: string;
  /** permalink */
  handle: string;
  title: string;
  /**
   * Description as plain text
   */
  description: string;

  /**
   * Description as html
   */
  descriptionHtml: string;

  /** Format: "2019-07-11T14:09:26Z" */
  updatedAt: string;
  /** Format: "2019-07-11T14:09:26Z" */
  createdAt: string;
  availableForSale: boolean;

  /** Vendor name */
  vendor: string;

  /**
   * Product type
   */
  productType: string;

  /**
   * Tags
   */
  tags: Array<string>;

  /** Actual number of images and size depends on context/listing */
  images: GraphQLList<ProductImage>;

  options: Array<ProductOption>;

  /**
   * Variants of the product
   */
  variants: GraphQLList<ProductVariant>;
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
  products: PaginatedGraphQLList<Product>;
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

/**
 * Get the first image of a product
 * @param product
 */
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

/**
 * Get a product variant
 * @param product
 * @param variant
 */
export function getProductVariant(product: Product, variant: string): ProductVariant | null {
  const n = product.variants.edges.find(v => {
    return v.node.id === variant;
  });
  return n ? n.node : null;
}

/**
 * Iterate product variants
 * @param product
 * @param predicate
 */
export function forEachProductVariant(
  product: Product,
  predicate: (variant: ProductVariant, index: number, product: Product) => void
): void {
  product.variants.edges.forEach((x, index) => {
    predicate(x.node, index, product);
  });
}

/**
 * Map each product variant
 * @param product
 * @param apply
 */
export function mapProductVariants<T>(
  product: Product,
  apply: (variant: ProductVariant, product: Product) => T
): Array<T> {
  return product.variants.edges.map(x => apply(x.node, product));
}

/**
 * Get the variant image
 */
export function getVariantImage(product: Product, variant: string): ProductImage | null {
  const v = getProductVariant(product, variant);
  return v ? v.image : null;
}

/**
 * Get the lowest variant price available
 * @param product
 */
export function getLowestVariantPrice(product: Product): PriceV2 | null {
  let p: PriceV2 | null = null;

  forEachProductVariant(product, variant => {
    if (p === null || variant.priceV2.amount < p.amount) {
      p = variant.priceV2;
    }
  });

  return p;
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

/**
 * Get the total price of all items
 */
export function getBasketTotalPrice(shop: ShopState, basket: Basket): PriceV2 {
  const total: PriceV2 = {
    amount: 0,
    currencyCode: ''
  };

  basket.items.forEach(i => {
    if (i.variant) {
      const p = shop.products[i.handle];
      if (p) {
        const v = getProductVariant(p, i.variant);
        if (v) {
          total.amount += v.priceV2.amount * i.quantity;
          if (!total.currencyCode) {
            total.currencyCode = v.priceV2.currencyCode;
          }
        }
      }
    }
  });

  return total;
}

/**
 * Get the next cursor for a list, or null, if not available
 * @param list
 */
export function getNextCursor(list: PaginatedGraphQLList<any>): string | null {
  if (list.pageInfo.hasNextPage && list.edges.length !== 0) {
    const x = list.edges[list.edges.length - 1];
    return x.cursor;
  }

  return null;
}

/**
 * Get the previous cursor for a list, or null, if not available
 * @param list
 */
export function getPreviousCursor(list: PaginatedGraphQLList<any>): string | null {
  if (list.pageInfo.hasPreviousPage && list.edges.length !== 0) {
    const x = list.edges[0];
    return x.cursor;
  }

  return null;
}
