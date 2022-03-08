import reducedProductQuery from './reducedProductQuery';
import { escapeQueryTerm, paginationArgs } from '../shopify-clientside';
import { ListProductsRequest } from '../index';
import { parseSearchString } from '../../search/parseSearchString';

export default function productListingQuery(req: ListProductsRequest): string {
  const productQuery = createProductQuery(req.q, req.productTypes, req.tags, true);

  return `products (query: ${escapeQueryTerm(productQuery)}, sortKey: ${req.sort || 'RELEVANCE'}, ${paginationArgs(
    req
  )}) {
      edges {
        node {
          ${reducedProductQuery(req.imageMaxWidth)}
        },
        cursor
      },
      pageInfo {
        hasNextPage,
        hasPreviousPage,
      }
    }`;
}

export function createProductQuery(
  text: string | null | undefined,
  productTypes: Array<string> | undefined,
  tags: Array<string> | undefined,
  availableForSale: boolean
): string {
  const r = {
    q: '',
    and: false
  };
  if (text) {
    const v = parseSearchString(text);
    if (v) {
      v.forEach((x: string) => {
        r.q += x + ' ';
      });
      r.and = true;
    }
  }

  if (availableForSale) {
    appendToQuery(r, 'available_for_sale:' + availableForSale);
  }

  addOrQuery(r, 'product_type', productTypes);
  addOrQuery(r, 'tag', tags);
  return r.q || 'available_for_sale:true';
}

function appendToQuery(r: { q: string; and: boolean }, v: string): void {
  if (v) {
    if (r.and) {
      r.q += ' AND ';
    }
    r.q += v;
    r.and = true;
  }
}

export function addOrQuery(r: { q: string; and: boolean }, name: string, values: Array<string> | undefined): void {
  if (!values || values.length === 0) {
    return;
  }

  let v = '(';
  let first = true;
  values.forEach(x => {
    if (first) {
      first = false;
    } else {
      v += ' OR ';
    }
    v += name + ':' + escapeQueryTerm(x);
  });
  v += ')';

  appendToQuery(r, v);
}
