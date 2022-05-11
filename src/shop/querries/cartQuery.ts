import fullProductQuery from './fullProductQuery';

export default function cartQuery(getProductData: boolean, imageMaxWidth: number): string {
  return `
  id,
  createdAt,
  updatedAt,
  lines(first: 100) {
    edges {
      node {
        id,
        merchandise {
          ... on ProductVariant {
            id,
            product {
               ${getProductData ? fullProductQuery(imageMaxWidth, true) : 'handle'}
            }
          }
        },
        quantity,
        attributes { key, value },
        discountAllocations {
          discountedAmount { amount, currencyCode }
        },
        estimatedCost {
          subtotalAmount { amount, currencyCode },
          totalAmount { amount, currencyCode }
        }
      }
    }
  },
  attributes { key, value },
  estimatedCost {
    totalAmount { amount, currencyCode },
    subtotalAmount { amount, currencyCode },
    totalTaxAmount { amount, currencyCode },
    totalDutyAmount { amount, currencyCode }
  },
  buyerIdentity {
    countryCode
  }
`;
}
