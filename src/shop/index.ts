//@flow

import { COMMUNITY_PARAMETER, getJson, post, Thunk, XcapJsonResult, XcapOptionalParameters } from '../api';
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

export interface MoneyV2 {
  amount: string;
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
  priceV2: MoneyV2;
  selectedOptions: SelectedProductOptions;
}

/**
 * Highest and lowest variant prices
 */
export interface PriceRange {
  minVariantPrice: MoneyV2;
  maxVariantPrice: MoneyV2;
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

  priceRange: PriceRange;
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

export interface GetShopConfigurationResult extends XcapJsonResult {
  shop: string | null;
  storeFrontAccessToken: string | null;
  webhookKey: string | null;
}

/**
 * Get the shop configuration. Requires admin privs
 * @returns {Thunk<XcapJsonResult>}
 */
export function getShopConfiguration(): Thunk<Promise<GetShopConfigurationResult>> {
  return getJson({
    url: '/shop/admin/get-config'
  });
}

/**
 * Store the shop configuration. Requires admin privs
 * @param shop
 * @param storeFrontAccessToken
 * @param webhookKey
 * @returns {Thunk<XcapJsonResult>}
 */
export function storeShopConfiguration({
  shop,
  storeFrontAccessToken,
  webhookKey
}: {
  shop: string | null;
  storeFrontAccessToken: string | null;
  webhookKey: string | null;
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
 * Iterate all list nodes
 * @param list
 * @param apply
 */
export function forEachListNode<T>(list: GraphQLList<T>, apply: (item: T) => void): void {
  if (!list || !list.edges) {
    return;
  }

  list.edges.forEach(n => apply(n.node));
}

/**
 * Map each node of a graph ql list
 * @param list
 * @param apply
 */
export function mapGraphQLList<U, T>(list: GraphQLList<T>, apply: (item: T, index: number) => U): U[] {
  if (!list || !list.edges) {
    return [];
  }

  return list.edges.map((value, index) => apply(value.node, index));
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
export function getLowestVariantPrice(product: Product): MoneyV2 | null {
  let p: MoneyV2 | null = null;

  forEachProductVariant(product, variant => {
    if (p === null || variant.priceV2.amount < p.amount) {
      p = variant.priceV2;
    }
  });

  return p;
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

export type LineItemArray = Array<LineItem>;

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  zip: string;
  city: string;
  province?: string;
  country: string;
  countryCodeV2: string;
  company?: string;
  phone?: string;
}

export interface CreateCheckoutInput {
  email?: string;
  note?: string;
  lineItems?: LineItemArray;
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
  priceV2: MoneyV2;
}

export interface CheckoutLineItem {
  id: string;
  title: string;
  quantity: number;
  variant: {
    id: string;
    product: {
      id: string;
      handle: string;
    };
  };
}

export interface Checkout {
  id: string;
  ready: boolean;
  webUrl: string;
  requiresShipping: boolean;
  currencyCode: string;
  email: string | null;
  note: string | null;
  subtotalPriceV2: MoneyV2;
  totalPriceV2: MoneyV2;
  totalTaxV2: MoneyV2;
  taxesIncluded: boolean;
  availableShippingRates?: {
    ready: boolean;
    shippingRates: Array<ShippingRate>;
  };
  shippingAddress: ShippingAddress | null;
  shippingLine: ShippingRate | null;
  /** The date and time when the checkout was completed. */
  completedAt: string | null;
  /** The Order Status Page for this Checkout, null when checkout is not completed. */
  orderStatusUrl: string | null;
  /** Items in basket */
  lineItems: GraphQLList<CheckoutLineItem>;
}

export interface CheckoutResult extends XcapJsonResult {
  response: {
    checkoutUserErrors: Array<CheckoutUserError>;
    checkout: Checkout | null;
  };
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

export interface GetCheckoutRequest extends XcapOptionalParameters {
  checkoutId: string;
  imageMaxWidth?: number;
}

export interface GetCheckoutResult extends XcapJsonResult {
  checkout: Checkout | null;
}

/**
 * Get a checkout given an id
 * @param req
 */
export function getCheckout(req: GetCheckoutRequest): Thunk<Promise<GetCheckoutResult>> {
  return getJson({
    url: '/shop/checkout/get',
    parameters: arguments
  });
}

export interface CheckoutReplaceItemsRequest extends XcapOptionalParameters {
  checkoutId: string;
  lineItems: LineItemArray;
}

/**
 * Replace the items in the checkout
 * @param req
 */
export function checkoutReplaceItems(req: CheckoutReplaceItemsRequest): Thunk<Promise<CheckoutResult>> {
  return post({
    url: '/shop/checkout/replace-items',
    parameters: {
      checkoutId: req.checkoutId,
      lineItems: JSON.stringify(req.lineItems),
      [COMMUNITY_PARAMETER]: req[COMMUNITY_PARAMETER]
    }
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
  address: ShippingAddress;
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

const CURRENCY_FORMATS: { [key: string]: Intl.NumberFormat } = {};

/**
 * Convert the amount to MoneyV2, adjusting to the currency correct number of decimals
 * @param amount
 * @param currencyCode
 */
export function toMoneyV2(amount: number, currencyCode: string): MoneyV2 {
  let fmt = CURRENCY_FORMATS[currencyCode];
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      useGrouping: false
    });
    CURRENCY_FORMATS[currencyCode] = fmt;
  }

  let a = fmt.format(amount);

  // Remove currency code
  a = a.replace(/[^0-9.\\-]/g, '');

  return {
    amount: a,
    currencyCode: currencyCode
  };
}
