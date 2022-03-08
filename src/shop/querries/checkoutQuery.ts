import moneyV2Query from './moneyV2Query';
import shippingAddressQuery from './shippingAddressQuery';
import fullProductQuery from './fullProductQuery';

/**
 * Note: the query for shipping rates will fail if address is not already set
 * @param getShippingRates
 * @param getProductData
 * @param imageMaxWidth
 * @returns {string}
 */
export default function checkoutQuery(
  getShippingRates: boolean,
  getProductData: boolean,
  imageMaxWidth: number
): string {
  let x = `
  id,
  webUrl,
  completedAt,
  orderStatusUrl,
  requiresShipping,
  currencyCode,
  email,
  note,
  lineItemsSubtotalPrice ${moneyV2Query()},
  subtotalPriceV2 ${moneyV2Query()},
  totalPriceV2 ${moneyV2Query()},
  totalTaxV2 ${moneyV2Query()},
  taxesIncluded,
  paymentDueV2 ${moneyV2Query()},
  shippingAddress {
    ${shippingAddressQuery()}
  },
  shippingLine {
    title,
    handle,
    priceV2 ${moneyV2Query()}
  },
  lineItems(first: 100) {
    edges {
      node {
        title,
        quantity,
        discountAllocations {
          allocatedAmount ${moneyV2Query()}
        },
        variant {
          product {
            ${getProductData ? fullProductQuery(imageMaxWidth, true) : 'handle'}
          }
        }
      }
    }
  }`;

  if (getShippingRates) {
    x += `,
    availableShippingRates {
      ready,
      shippingRates {
        title,
        handle,
        priceV2: ${moneyV2Query()}
      }
    }`;
  }

  return x;
}
