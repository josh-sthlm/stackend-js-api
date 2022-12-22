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
  subtotalPrice ${moneyV2Query()},
  subtotalPriceV2: subtotalPrice ${moneyV2Query()},
  totalPrice ${moneyV2Query()},
  totalPriceV2: totalPrice ${moneyV2Query()},
  totalTax ${moneyV2Query()},
  totalTaxV2: totalTax ${moneyV2Query()},
  taxesIncluded,
  paymentDue ${moneyV2Query()},
  paymentDueV2: paymentDue ${moneyV2Query()},
  shippingAddress {
    ${shippingAddressQuery()}
  },
  shippingLine {
    title,
    handle,
    price ${moneyV2Query()},
    priceV2: price ${moneyV2Query()}
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
        price: ${moneyV2Query()},
        priceV2: price ${moneyV2Query()}
      }
    }`;
  }

  return x;
}
