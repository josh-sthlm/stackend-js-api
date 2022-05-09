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

export interface PaginatedGraphQLRequest {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

/**
 * Create a request to the next page
 * @param req
 * @param after
 * @param first, if not present taken from req.last or defaults to 10
 */
export function nextPage(req: PaginatedGraphQLRequest, after: string, first?: number): PaginatedGraphQLRequest {
  const r: PaginatedGraphQLRequest = {
    ...req,
    after,
    first: first || req.first || req.last || 10
  };

  delete r['before'];
  delete r['last'];

  return r;
}

/**
 * Create a request to the previous page
 * @param req
 * @param before
 * @param last, if not present taken from req.first or defaults to 10
 */
export function previousPage(req: PaginatedGraphQLRequest, before: string, last?: number): PaginatedGraphQLRequest {
  const r: PaginatedGraphQLRequest = {
    ...req,
    before,
    last: last || req.last || req.first || 10
  };

  delete r['after'];
  delete r['first'];
  return r;
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
 * Iterate all list nodes
 * @param list
 * @param apply
 */
export function forEachGraphQLList<T>(list: GraphQLList<T>, apply: (item: T) => void): void {
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
 * Convert a js object into graphql format query
 * @param o
 */
export function toQueryParameters(o: any): string {
  if (o === null) {
    return 'null';
  }

  const t = typeof o;
  if (t === 'undefined') {
    return 'null';
  }

  if (t !== 'object') {
    // Primitive
    return JSON.stringify(o);
  }

  if (Array.isArray(o)) {
    return _arrayToQueryParameters(o);
  }

  return _objectToQueryParameters(o);
}

export function _arrayToQueryParameters(a: Array<any>): string {
  let r = '[';
  for (let i = 0; i < a.length; i++) {
    const l = a[i];
    if (i != 0) {
      r += ',';
    }
    r += toQueryParameters(l);
  }
  r += ']';
  return r;
}

export function _objectToQueryParameters(o: Record<string, any>): string {
  let r = '{';
  Object.keys(o).forEach((k, i) => {
    if (i !== 0) {
      r += ',';
    }
    r += k + ':';
    const v = o[k];
    r += toQueryParameters(v);
  });

  r += '}';
  return r;
}
