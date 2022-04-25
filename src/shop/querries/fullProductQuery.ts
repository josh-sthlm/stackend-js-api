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
        priceV2 ${moneyV2Query()}
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
  }
`;
}