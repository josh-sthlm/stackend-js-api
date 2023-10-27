//@flow

import moneyV2Query from './moneyV2Query';
import imageQuery from './imageQuery';

export default function fullProductQuery(imageMaxWidth: number | null, includeOriginalSrc?: boolean): string {
  return `
  id,
  handle,
  title,
  descriptionHtml,
  updatedAt,
  createdAt,
  availableForSale,
  productType,
  tags,
  vendor,
  priceRange {
    maxVariantPrice ${moneyV2Query()},
    minVariantPrice ${moneyV2Query()},
  },
  options {
    id,
    name,
    values,
  },
  variants (first: 100) {
    edges {
      node {
        id,
        title,
        availableForSale,
        sku,
        image {
          ${imageQuery(imageMaxWidth, includeOriginalSrc)}
        },
        selectedOptions {
          name,
          value
        },
        price ${moneyV2Query()},
        priceV2: price ${moneyV2Query()},
        compareAtPrice ${moneyV2Query()},
        weight,
        weightUnit
      }
    }
  },
  images (first: 10, sortKey: POSITION) {
    edges {
      node {
        ${imageQuery(imageMaxWidth, includeOriginalSrc)}
      }
    }
  },
  collections (first: 100) {
    edges {
      node {
        handle
      }
    }
  },
  metafield__stackendAddToCartLink: metafield (namespace:"custom", key:"stackend") {
    id,
    key,
    value
  }
`;
}
