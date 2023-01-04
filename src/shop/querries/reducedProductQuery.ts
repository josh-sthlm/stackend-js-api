import moneyV2Query from './moneyV2Query';
import imageQuery from './imageQuery';

export default function reducedProductQuery(
  imageMaxWidth: number | undefined | null,
  includeOriginalSrc = false
): string {
  return `
  id,
  handle,
  title,
  updatedAt,
  createdAt,
  availableForSale,
  productType,
  vendor,
  priceRange {
    minVariantPrice ${moneyV2Query()},
    maxVariantPrice ${moneyV2Query()}
  },
  options {
    id,
    name,
    values
  },
  images (first: 10) {
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
