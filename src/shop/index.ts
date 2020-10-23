//@flow

import { COMMUNITY_PARAMETER, getJson, post, Thunk, XcapJsonResult, XcapOptionalParameters } from '../api';
import { ShopState } from './shopReducer';
import AddressFormatter, { Country } from '@shopify/address';
import { FieldName } from '@shopify/address-consts';
import { getStackendLocale } from '../util';
import { setLoadingThrobberVisible } from '../throbber/throbberActions';

export const DEFAULT_IMAGE_MAX_WIDTH = 1024;

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

export interface SlimProductImage {
  altText: string | null;
  transformedSrc: string;
}

export interface ProductImage extends SlimProductImage {
  originalSrc: string;
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

export interface SelectedProductOption {
  name: string;
  value: string;
}

export type SelectedProductOptions = Array<SelectedProductOption>;

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
  selectedOptions: SelectedProductOptions;
}

/**
 * Highest and lowest variant prices
 */
export interface CompareAtPriceRange {
  minVariantPrice: PriceV2;
  maxVariantPrice: PriceV2;
}

export interface SlimProduct {
  id: string;

  /** permalink */
  handle: string;

  title: string;

  /** Format: "2019-07-11T14:09:26Z" */
  updatedAt: string;

  /** Format: "2019-07-11T14:09:26Z" */
  createdAt: string;

  availableForSale: boolean;

  /**
   * Product type
   */
  productType: string;

  /** Images. Actual number of images and size depends on context/listing */
  images: GraphQLList<SlimProductImage>;

  compareAtPriceRange: CompareAtPriceRange;
}

/**
 * A product, including variants
 */
export interface Product extends SlimProduct {
  /**
   * Description as html
   */
  descriptionHtml: string;

  /** Vendor name */
  vendor: string;

  /**
   * Tags
   */
  tags: Array<string>;

  /**
   * Product options
   */
  options: Array<ProductOption>;

  /**
   * Variants of the product
   */
  variants: GraphQLList<ProductVariant>;

  /** Images. Actual number of images and size depends on context/listing */
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
  imageMaxWidth?: number;
}

export interface ListProductsResult extends XcapJsonResult {
  products: PaginatedGraphQLList<SlimProduct>;
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
  imageMaxWidth?: number;
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
  imageMaxWidth?: number;
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
export function getFirstImage(product: SlimProduct | Product | null): ProductImage | SlimProductImage | null {
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
  public readonly variant: string;
  public quantity: number;

  constructor(handle: string, variant: string, quantity?: number) {
    this.handle = handle;
    this.quantity = quantity || 1;
    this.variant = variant;
  }

  matches(handle: string, variant?: string): boolean {
    return handle === this.handle && (!variant || variant === this.variant);
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
  add(handle: string, variant: string, quantity?: number): number {
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

  /**
   * Construct to lineItems for checkout
   */
  toLineItems(): Array<LineItem> {
    const lineItems: Array<LineItem> = [];
    this.items.forEach(i =>
      lineItems.push({
        variantId: i.variant as string,
        quantity: i.quantity
      })
    );

    return lineItems;
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

/**
 * Find a product variant given an image
 * @param product
 * @param image
 */
export function findProductVariantByImage(product: Product, image: ProductImage): ProductVariant | null {
  if (!product || !image) {
    return null;
  }

  const x = product.variants.edges.find(v => {
    return v.node?.image?.transformedSrc === image.transformedSrc;
  });

  return x ? x.node : null;
}

export interface ProductSelection {
  [name: string]: string;
}

/**
 * Given a selection, find the product variant
 * @param product
 * @param selection
 */
export function findExactProductVariant(product: Product, selection: ProductSelection): ProductVariant | null {
  if (!product || !selection || product.variants.edges.length === 0) {
    return null;
  }

  const x = product.variants.edges.find(v => matchSelection(v.node, selection, false));

  return x ? x.node : null;
}

export function findAllProductVariants(product: Product, selection: ProductSelection): Array<ProductVariant> {
  if (!product || !selection || product.variants.edges.length === 0) {
    return [];
  }

  const m: Array<ProductVariant> = [];

  product.variants.edges.forEach(v => {
    if (matchSelection(v.node, selection, true)) {
      m.push(v.node);
    }
  });

  return m;
}

/**
 * Check if a product variant matches the selection
 * @param variant
 * @param selection
 * @param returnPartialMatches
 */
export function matchSelection(
  variant: ProductVariant,
  selection: ProductSelection,
  returnPartialMatches: boolean
): boolean {
  if (!variant) {
    return false;
  }

  for (const o of variant.selectedOptions) {
    const x = selection[o.name];
    if (x) {
      if (x !== o.value) {
        return false;
      }
    } else {
      if (!returnPartialMatches) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Given a variant, construct the corresponding selection
 * @param product
 * @param variant
 * @returns {Selection}
 */
export function getProductSelection(product: Product, variant: ProductVariant): ProductSelection {
  const s: ProductSelection = {};
  if (!product || !variant) {
    return s;
  }

  for (const o of variant.selectedOptions) {
    s[o.name] = o.value;
  }

  return s;
}

/**
 * Get unique product images, including variant images
 * @param product
 */
export function getAllUniqueImages(product: Product): Array<ProductImage> {
  const images: Array<ProductImage> = [];
  const s: Set<string> = new Set<string>();

  if (!product) {
    return images;
  }

  for (const i of product.images.edges) {
    const img = i.node;
    if (!s.has(img.transformedSrc)) {
      images.push(img);
      s.add(img.transformedSrc);
    }
  }

  for (const v of product.variants.edges) {
    const img = v.node.image;
    if (img && !s.has(img.transformedSrc)) {
      images.push(img);
      s.add(img.transformedSrc);
    }
  }

  return images;
}

export interface LineItem {
  quantity: number;
  variantId: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  zip: string;
  city: string;
  province?: string;
  country: string;
  company?: string;
  phone?: string;
}

export interface CreateCheckoutInput {
  email: string;
  note?: string;
  lineItems?: Array<LineItem>;
  shippingAddress?: ShippingAddress;
}

export interface CreateCheckoutRequest extends XcapOptionalParameters {
  input: CreateCheckoutInput;
}

export interface CheckoutUserError {
  field: string;
  code: string;
  message: string;
}

export interface ShippingRate {
  handle: string;
  title: string;
  priceV2: PriceV2;
}

export interface Checkout {
  id: string;
  ready: boolean;
  webUrl: string;
  requiresShipping: boolean;
  currencyCode: string;
  email: string;
  note: string;
  subtotalPriceV2: PriceV2;
  totalPriceV2: PriceV2;
  totalTaxV2: PriceV2;
  taxesIncluded: boolean;
  availableShippingRates: {
    ready: boolean;
    shippingRates: Array<ShippingRate>;
  };
  shippingAddress: ShippingAddress;
  shippingLine: ShippingRate | null;
}

export interface CheckoutResult extends XcapJsonResult {
  checkoutUserErrors: Array<CheckoutUserError>;
  checkout: Checkout;
}

/**
 * Create a checkout
 * @param req
 */
export function createCheckout(req: CreateCheckoutRequest): Thunk<Promise<CheckoutResult>> {
  const p = {
    input: JSON.stringify(req.input),
    [COMMUNITY_PARAMETER]: req[COMMUNITY_PARAMETER]
  };

  return post({
    url: '/shop/checkout/create',
    parameters: p
  });
}

export interface SelectShippingRequest extends XcapOptionalParameters {
  checkoutId: string;
  shippingRateHandle: string;
}

/**
 * Select shipping
 * @param req
 */
export function selectShipping(req: SelectShippingRequest): Thunk<Promise<CheckoutResult>> {
  return post({
    url: '/shop/checkout/set-shipping',
    parameters: arguments
  });
}

export interface SetCheckoutEmailRequest extends XcapOptionalParameters {
  checkoutId: string;
  email: string;
}

/**
 * Set email
 * @param req
 */
export function setCheckoutEmail(req: SetCheckoutEmailRequest): Thunk<Promise<CheckoutResult>> {
  return post({
    url: '/shop/checkout/set-email',
    parameters: arguments
  });
}

export interface SetShippingAddressRequest extends XcapOptionalParameters {
  checkoutId: string;
  address: string;
}

/**
 * Set shipping address
 * @param req
 */
export function setShippingAddress(req: SetShippingAddressRequest): Thunk<Promise<CheckoutResult>> {
  const p = {
    checkoutId: req.checkoutId,
    addressJson: JSON.stringify(req.address),
    [COMMUNITY_PARAMETER]: req[COMMUNITY_PARAMETER]
  };
  return post({
    url: '/shop/checkout/set-shipping-address',
    parameters: p
  });
}

/**
 * Get the locale, falling back to the community locale if not supplied
 * @param locale
 */
export function getLocale(locale?: string | null): Thunk<Promise<string>> {
  return async (dispatch, getState): Promise<string> => {
    let l = locale;
    if (!l) {
      const state = getState();
      l = getStackendLocale(state?.communities?.community?.locale);
    }

    if (!l) {
      throw Error('No locale supplied');
    }
    return l;
  };
}

/**
 * Get the required address fields for the country using the specified locale.
 * @param locale (Optional. falls back to community locale)
 * @param countryCode
 */
export function getAddressFields({
  locale,
  countryCode
}: {
  locale?: string | null;
  countryCode: string;
}): Thunk<Promise<FieldName[][]>> {
  return async (dispatch: any): Promise<FieldName[][]> => {
    try {
      await dispatch(setLoadingThrobberVisible(true));
      const l = await dispatch(getLocale(locale));
      const addressFormatter = new AddressFormatter(l);
      return await addressFormatter.getOrderedFields(countryCode);
    } finally {
      await dispatch(setLoadingThrobberVisible(false));
    }
  };
}

/**
 * Get the list of countries
 * @param locale
 */
export function getCountries({ locale }: { locale?: string }): Thunk<Promise<Array<Country>>> {
  return async (dispatch: any): Promise<Array<Country>> => {
    try {
      await dispatch(setLoadingThrobberVisible(true));
      const l = await dispatch(getLocale(locale));
      const addressFormatter = new AddressFormatter(l);
      return await addressFormatter.getCountries();
    } finally {
      await dispatch(setLoadingThrobberVisible(false));
    }
  };
}

/**
 * Get a country
 * @param locale
 * @param countryCode
 */
export function getCountry({ locale, countryCode }: { locale?: string; countryCode: string }): Thunk<Promise<Country>> {
  return async (dispatch: any): Promise<Country> => {
    try {
      await dispatch(setLoadingThrobberVisible(true));
      const l = await dispatch(getLocale(locale));
      const addressFormatter = new AddressFormatter(l);
      return await addressFormatter.getCountry(countryCode);
    } finally {
      await dispatch(setLoadingThrobberVisible(false));
    }
  };
}
