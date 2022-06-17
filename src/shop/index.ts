import {
  COMMUNITY_PARAMETER,
  getJson,
  isRunningServerSide,
  post,
  Thunk,
  XcapJsonResult,
  XcapOptionalParameters
} from '../api';
import { getLocale } from '../util';
import { forEachGraphQLList, GraphQLList, PaginatedGraphQLList, PaginatedGraphQLRequest } from '../util/graphql';
import { ShopConfig, ShopDefaults } from './shopReducer';
import { Community } from '../stackend';
import { CommunityState } from '../stackend/communityReducer';
import * as ShopifyClientside from './shopify-clientside';

export interface SlimProductImage {
  altText: string | null;
  /**
   * The url to the scaled version of the image
   */
  url: string;
}

export interface ProductImage extends SlimProductImage {
  /**
   * The url to the original version of the image
   */
  url__originalSrc: string;
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

  /** Max and min price */
  priceRange: PriceRange;

  /** List of collection handles */
  collections: GraphQLList<{ handle: string }>;
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

export interface Country {
  name: string;
  code: string;
  continent: string;
  phoneNumberPrefix: number;
  autocompletionField: string;
  provinceKey:
    | 'COUNTY'
    | 'EMIRATE'
    | 'GOVERNORATE'
    | 'PREFECTURE'
    | 'PROVINCE'
    | 'REGION'
    | 'STATE_AND_TERRITORY'
    | 'STATE';
  labels: {
    address1: string;
    address2: string;
    city: string;
    company: string;
    country: string;
    firstName: string;
    lastName: string;
    phone: string;
    postalCode: string;
    zone: string;
  };
  optionalLabels: {
    address2: string;
  };
  formatting: {
    edit: string;
    show: string;
  };
}

export enum AddressFieldName {
  FirstName = 'firstName',
  LastName = 'lastName',
  Country = 'country',
  City = 'city',
  PostalCode = 'zip',
  Zone = 'province',
  Address1 = 'address1',
  Address2 = 'address2',
  Phone = 'phone',
  Company = 'company'
}

export interface MultipleProductListingsResult {
  [key: string]: {
    request: ListProductsQuery;
    listing: PaginatedGraphQLList<SlimProduct>;
  };
}

/**
 * Result when requesting multiple shop related items using init/data
 */
export interface ShopDataResult {
  products: { [handle: string]: Product };
  collections: { [handle: string]: Collection };
  listings: MultipleProductListingsResult;
  shopifyDomainReferenceUrlId: number;
}

export interface GetShopConfigurationResult extends XcapJsonResult {
  shop: string | null;
  storeFrontAccessToken: string | null;
  webhookKey: string | null;
  enableCartNotifications: boolean;
}

/**
 * Check if the shop is enabled
 * @param community
 */
export function isShopEnabled(community: Community): boolean {
  if (!community) {
    return false;
  }
  return typeof community.settings.shop != 'undefined';
}

/**
 * Get shopify configuration from store
 * @return null if disabled
 */
export function getShopifyConfig(): Thunk<ShopConfig | null> {
  return (dispatch: any, getState): ShopConfig | null => {
    const communities: CommunityState = getState().communities;
    const community = communities.community;
    if (!community || !community.settings.shop) {
      return null;
    }

    return {
      domain: community.settings.shop.domain,
      accessToken: community.settings.shop.at,
      countryCode: community.settings.shop.countryCode,
      apiVersion: ShopifyClientside.API_VERSION
    };
  };
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

export interface StoreShopConfigurationResult extends XcapJsonResult {
  stackendCommunity: Community;
}
/**
 * Store the shop configuration. Requires admin privs
 * @param shop
 * @param storeFrontAccessToken
 * @param webhookKey
 * @param enableCartNotifications
 * @returns {Thunk<XcapJsonResult>}
 */
export function storeShopConfiguration({
  shop,
  storeFrontAccessToken,
  webhookKey,
  enableCartNotifications = false
}: {
  shop: string | null;
  storeFrontAccessToken: string | null;
  webhookKey: string | null;
  enableCartNotifications: boolean;
} & XcapOptionalParameters): Thunk<Promise<StoreShopConfigurationResult>> {
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
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/list-product-types',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.listProductTypes(req);
  }
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

/**
 * Parse a product sort key
 * @param sort
 * @param defaultValue
 */
export function parseProductSortKey(sort: string | null | undefined, defaultValue?: ProductSortKeys): ProductSortKeys {
  if (!sort) {
    return defaultValue || ProductSortKeys.RELEVANCE;
  }

  const v = (ProductSortKeys as any)[sort];
  return v || defaultValue || ProductSortKeys.RELEVANCE;
}

export interface ListProductsQuery extends PaginatedGraphQLRequest {
  q?: string;
  productTypes?: Array<string>;
  tags?: Array<string>;
  sort?: ProductSortKeys;
  imageMaxWidth?: number;
}

export interface ListProductsRequest extends ListProductsQuery, XcapOptionalParameters {}

export interface ListProductsResult extends XcapJsonResult {
  products: PaginatedGraphQLList<SlimProduct>;
}

export function applyDefaults(req: ListProductsQuery, defaults: ShopDefaults): void {
  if (!req.imageMaxWidth) {
    req.imageMaxWidth = defaults.listingImageMaxWidth;
  }

  if (req.after) {
    if (!req.first) {
      req.first = defaults.pageSize;
    }
  } else if (req.before) {
    if (!req.last) {
      req.last = defaults.pageSize;
    }
  } else {
    if (!req.first && !req.after) {
      req.first = defaults.pageSize;
    }
  }
}

/**
 * Create a new ListProductsRequest with default options
 * @param req
 */
export const newListProductsRequest =
  (req?: Partial<ListProductsRequest>): Thunk<ListProductsRequest> =>
  (dispatch: any, getState: any): ListProductsRequest => {
    if (!req) {
      req = {};
    }

    applyDefaults(req, getState().shop.defaults);

    return req;
  };

/**
 * List products
 * @param req
 * @returns {Thunk<ListProductsResult>}
 */
export function listProducts(req: ListProductsRequest): Thunk<Promise<ListProductsResult>> {
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/list-products',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.listProducts(req);
  }
}

export interface GetProductRequest extends XcapOptionalParameters {
  handle: string;
  imageMaxWidth?: number;
}

export interface GetProductResult extends XcapJsonResult {
  product: Product | null;
}

/**
 * Create a new GetProductRequest with default image sizes
 * @param req GetProductRequest or handle
 */
export const newGetProductRequest =
  (req: GetProductRequest | string): Thunk<GetProductRequest> =>
  (dispatch: any, getState: any): GetProductRequest => {
    if (typeof req === 'string') {
      req = {
        handle: req
      };
    }

    const defaults: ShopDefaults = getState().shop.defaults;
    if (!req.imageMaxWidth) {
      req.imageMaxWidth = defaults.imageMaxWidth;
    }

    return req;
  };

/**
 * Get a single product
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getProduct(req: GetProductRequest): Thunk<Promise<GetProductResult>> {
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/get-product',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.getProduct(req);
  }
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
 * Create a new GetProductsRequest with default image sizes
 * @param req GetProductsRequest or handles
 */
export const newGetProductsRequest =
  (req: GetProductsRequest | Array<string>): Thunk<GetProductsRequest> =>
  (dispatch: any, getState: any): GetProductsRequest => {
    if (Array.isArray(req)) {
      req = {
        handles: req
      };
    }

    if (!req.imageMaxWidth) {
      const defaults: ShopDefaults = getState().shop.defaults;
      req.imageMaxWidth = defaults.imageMaxWidth;
    }

    return req;
  };

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
  // FIXME: Add client side version
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
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/list-products-and-types',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.listProductsAndTypes(req);
  }
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
 * Find a product variant given an image
 * @param product
 * @param image
 */
export function findProductVariantByImage(product: Product, image: ProductImage): ProductVariant | null {
  if (!product || !image) {
    return null;
  }

  const x = product.variants.edges.find(v => {
    return v.node?.image?.url === image.url;
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
export function getProductSelection(product: Product | null, variant: ProductVariant | null): ProductSelection {
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

  forEachGraphQLList(product.images, img => {
    if (!s.has(img.url)) {
      images.push(img);
      s.add(img.url);
    }
  });

  forEachGraphQLList(product.variants, v => {
    const img = v.image;
    if (img && !s.has(img.url)) {
      images.push(img);
      s.add(img.url);
    }
  });

  return images;
}

/**
 * A named collection. Slim version used in listings
 */
export interface SlimCollection {
  id: string;
  description: string;
  title: string;
  handle: string;
}

/**
 * A named collection of products
 */
export interface Collection extends SlimCollection {
  descriptionHtml: string;
  products: GraphQLList<SlimProduct>;
}

export interface GetCollectionRequest extends XcapOptionalParameters {
  handle: string;
  imageMaxWidth?: number;
}

export interface GetCollectionResult extends XcapJsonResult {
  collection: Collection | null;
}

/**
 * Get a collection of products
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getCollection(req: GetCollectionRequest): Thunk<Promise<GetCollectionResult>> {
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/get-collection',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.getCollection(req);
  }
}

export interface GetCollectionsResult extends XcapJsonResult {
  collections: GraphQLList<SlimCollection>;
}

export type GetCollectionsRequest = XcapOptionalParameters;

/**
 * Get all collections. Requires community admin privileges.
 * @param req
 * @returns {Thunk<XcapJsonResult>}
 */
export function getCollections(req: GetCollectionsRequest): Thunk<Promise<GetCollectionsResult>> {
  if (isRunningServerSide()) {
    return getJson({
      url: '/shop/get-collections',
      parameters: arguments
    });
  } else {
    return ShopifyClientside.getCollections(req);
  }
}

export interface CreateCartLine {
  /** Cart line id */
  id?: string;

  /**
   * Product variant id "gid://shopify/ProductVariant/1"
   */
  merchandiseId: string;

  /**
   * Quantity
   */
  quantity?: number;
}

export interface CreateCartRequest {
  lines: Array<CreateCartLine>;
  buyerIdentity?: CartBuyerIdentity;
  imageMaxWidth?: number;
}

export interface CartLine {
  id: string;
  merchandise: {
    /**
     * Product variant id
     */
    id: string;

    product: {
      /** Product id */
      id: string;
      /** Product handle */
      handle: string;
    };
  };
  quantity: number;
  discountAllocations: Array<any>;
  attributes: Array<{ key: string; value: string }>;
  estimatedCost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
  };
}

export interface CartRequest {
  cartId: string;
  imageMaxWidth?: number;
}

export interface Cart {
  id: string;
  createdAt: string;
  updatedAt: string;
  lines: GraphQLList<CartLine>;
  estimatedCost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
    totalDutyAmount: MoneyV2 | null;
  };
  attributes: Array<any>;
  buyerIdentity: {
    countryCode: string;
  };
}

export interface GetCartResult extends XcapJsonResult {
  cart: Cart | null;
}

export interface ModifyCartResult extends GetCartResult {
  userErrors?: Array<UserError>;
}

/**
 * Create a cart
 * @param req
 */
export function createCart(req: CreateCartRequest): Thunk<Promise<ModifyCartResult>> {
  return ShopifyClientside.createCart(req);
}

/**
 * Alter the contents of the cart. You can not add new lines using this request
 * @param req
 */
export function cartLinesUpdate(req: CartLinesUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return ShopifyClientside.cartLinesUpdate(req);
}

/**
 * Add products of the cart
 * @param req
 */
export function cartLinesAdd(req: CartLinesUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return ShopifyClientside.cartLinesAdd(req);
}

export type GetCartRequest = CartRequest;

/**
 * Get a cart
 * @param req
 */
export function getCart(req: GetCartRequest): Thunk<Promise<GetCartResult>> {
  return ShopifyClientside.getCart(req);
}

export interface CartLinesUpdateRequest extends CartRequest, CreateCartRequest {}

export interface CartLinesRemoveRequest extends CartRequest {
  lineIds: Array<string>;
}

/**
 * Remove a product line from the cart
 * @param req
 */
export function cartLinesRemove(req: CartLinesRemoveRequest): Thunk<Promise<ModifyCartResult>> {
  return ShopifyClientside.cartLinesRemove(req);
}

export interface CartBuyerIdentity {
  countryCode?: string;
  customerAccessToken?: string;
  email?: string;
  phone?: string;
}

export interface CartBuyerIdentityUpdateRequest extends CartRequest {
  buyerIdentity: CartBuyerIdentity;
}

/**
 * Update buyer identity or country
 * @param req
 */
export function cartBuyerIdentityUpdate(req: CartBuyerIdentityUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return ShopifyClientside.cartBuyerIdentityUpdate(req);
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
  addedProductHandle?: string;
  variantId?: string;
  quantity?: number;
  referenceUrlId?: string;
}

export interface UserError {
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

  /** Price of the checkout before duties, shipping and taxes. */
  subtotalPriceV2: MoneyV2;

  /** The sum of all the prices of all the items in the checkout. Duties, taxes, shipping and discounts excluded */
  lineItemsSubtotalPrice: MoneyV2;

  /** The sum of all the prices of all the items in the checkout, duties, taxes and discounts included. */
  totalPriceV2: MoneyV2;

  /** The amount left to be paid. This is equal to the cost of the line items, duties, taxes and shipping minus discounts and gift cards. */
  paymentDueV2: MoneyV2;

  /** The sum of all the taxes applied to the line items and shipping lines in the checkout. */
  totalTaxV2: MoneyV2;

  /** Specifies if taxes are included in the line item and shipping line prices. */
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
    checkoutUserErrors: Array<UserError>;
    checkout: Checkout | null;
  };
}

/**
 * Create a checkout
 * @param req
 */
export function createCheckout(req: CreateCheckoutRequest): Thunk<Promise<CheckoutResult>> {
  return post({
    url: '/shop/checkout/create',
    parameters: {
      ...req,
      input: JSON.stringify(req.input)
    }
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
  addedProductHandle?: string;
  variantId?: string;
  quantity?: number;
  referenceUrlId?: string;
}

/**
 * Replace the items in the checkout
 * @param req
 */
export function checkoutReplaceItems(req: CheckoutReplaceItemsRequest): Thunk<Promise<CheckoutResult>> {
  return post({
    url: '/shop/checkout/replace-items',
    parameters: {
      ...req,
      lineItems: JSON.stringify(req.lineItems)
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
}): Thunk<Promise<AddressFieldName[][]>> {
  return async (dispatch: any): Promise<AddressFieldName[][]> => {
    const l = await dispatch(getLocale(locale));
    const r = await dispatch(
      getJson({
        url: '/shop/countries/get-address-fields',
        parameters: { locale: l, countryCode }
      })
    );
    return r.error ? [] : r.addressFields;
  };
}

/**
 * Get the list of countries
 * @param locale
 */
export function getCountries({ locale }: { locale?: string }): Thunk<Promise<Array<Country>>> {
  return async (dispatch: any): Promise<Array<Country>> => {
    const l = await dispatch(getLocale(locale));
    const r = await dispatch(
      getJson({
        url: '/shop/countries/get-all',
        parameters: { locale: l }
      })
    );
    return r.error ? [] : r.countries;
  };
}

/**
 * Get a country
 * @param locale
 * @param countryCode
 */
export function getCountry({
  locale,
  countryCode
}: {
  locale?: string;
  countryCode: string;
}): Thunk<Promise<Country | null>> {
  return async (dispatch: any): Promise<Country | null> => {
    const l = await dispatch(getLocale(locale));
    const r = await dispatch(
      getJson({
        url: '/shop/countries/get',
        parameters: { locale: l, countryCode }
      })
    );
    return r.error ? null : r.country;
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

/**
 * Get the root nodes from a flat array of product types
 * @param productTypes
 */
export function getProductTypeRoots(productTypes: Array<string> | null | undefined): Array<string> {
  if (!productTypes) {
    return [];
  }
  const x: Set<string> = new Set();
  productTypes.forEach(p => {
    if (p === '') {
      return;
    }
    const v: string = p;
    const i = v.indexOf('/');
    if (i === -1) {
      x.add(v);
    } else {
      x.add(v.substring(0, i));
    }
  });

  return Array.from(x);
}

/**
 * Get the parent product type
 * @param productType
 */
export function getParentProductType(productType: string | null | undefined): string | null {
  if (!productType) {
    return null;
  }
  const i = productType.lastIndexOf('/');
  if (i === -1) {
    return null;
  }

  return productType.substring(0, i);
}

export function cartFindLine(cart: Cart, productVariantId: string): CartLine | null {
  for (const e of cart.lines.edges) {
    if (e.node.merchandise.id == productVariantId) {
      return e.node;
    }
  }

  return null;
}

/**
 * Turn a cart into checkout line items
 * @param cart
 */
export function cartToLineItems(cart: Cart): Array<LineItem> {
  const lineItems: Array<LineItem> = [];
  if (cart) {
    forEachGraphQLList(cart.lines, i => {
      const l: LineItem = {
        variantId: i.merchandise.id,
        quantity: i.quantity
      };
      lineItems.push(l);
    });
  }
  return lineItems;
}

export interface CartNotifyProductAddedRequest extends XcapOptionalParameters {
  handle: string;
  variantId: string;
}

/**
 * Notify users that someone added a product to their cart
 * @param params
 */
export function cartNotifyProductAdded(params: CartNotifyProductAddedRequest): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      post({
        url: '/shop/cart/notify-product-added',
        parameters: { ...params }
      })
    );
  };
}
