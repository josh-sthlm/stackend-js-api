//@flow

export interface PaginatedCollection<T> {
  page: number;
  pageSize: number;
  totalSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  lastPage: number;
  firstPage: number;
  nextPage: number;
  previousPage: number;
  entries: Array<T>;
}

/**
 * Construct a new paginated collection.
 *
 * @param entries Entries (optional, default empty).
 * @param page Page number (optional, default 1)
 * @param pageSize Page size (optional, default 10)
 * @param totalSize Total size (optional, taken from entries)
 */
export function newPaginatedCollection<T>({
  entries = [],
  page = 1,
  pageSize = 10,
  totalSize = 0
}: {
  entries?: Array<T>;
  page?: number;
  pageSize?: number;
  totalSize?: number;
}): PaginatedCollection<T> {
  const e = entries || [];
  const tz = totalSize || e.length;
  const hasPreviousPage = page > 1;
  const previousPage = page > 1 ? page - 1 : 1;
  const hasNextPage = pageSize * page < tz;
  const nextPage = hasNextPage ? page + 1 : 1;
  const lastPage = Math.max(1, Math.ceil(tz / pageSize));

  return {
    page: page,
    pageSize,
    totalSize: tz,
    hasNextPage,
    hasPreviousPage,
    lastPage,
    firstPage: 1,
    nextPage,
    previousPage,
    entries: e
  };
}

/**
 * Construct a new empty paginated collection.
 * @param pageSize
 */
export function emptyPaginatedCollection<T>(pageSize = 10): PaginatedCollection<T> {
  return newPaginatedCollection({ pageSize });
}

/**
 * Create a new paginated collection given an array of all entries. Only the current page will be included in the pagination
 * @param entries All entries
 * @param page
 * @param pageSize
 */
export function newPaginatedCollectionForPage<T>({
  entries = [],
  page = 1,
  pageSize = 10
}: {
  entries?: Array<T>;
  page?: number;
  pageSize?: number;
}): PaginatedCollection<T> {
  if (!entries || entries.length === 0) {
    return emptyPaginatedCollection(pageSize);
  }

  const pageEntries = getEntriesOfPage(entries, page, pageSize);

  return newPaginatedCollection({
    entries: pageEntries,
    page,
    pageSize,
    totalSize: entries.length
  });
}

/**
 * From a list, extract the entries making up the page using the page size
 * @param entries
 * @param page
 * @param pageSize
 */
export function getEntriesOfPage<T>(entries: Array<T>, page: number, pageSize: number): Array<T> {
  if (!entries) {
    return [];
  }

  let start = (page - 1) * pageSize;
  let end = start + pageSize;

  if (end > entries.length) end = entries.length;

  if (start > end) start = end;

  return entries.slice(start, end);
}
