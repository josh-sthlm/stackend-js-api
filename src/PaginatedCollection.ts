//@flow


export interface PaginatedCollection<T> {
	page: number,
	pageSize: number,
	totalSize: number,
	hasNextPage: boolean,
	hasPreviousPage: boolean,
	lastPage: number,
	firstPage: number,
	nextPage: number,
	previousPage: number,
	entries: Array<T>
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
	entries?: Array<T>,
	page?: number,
	pageSize?: number,
	totalSize?: number
}): PaginatedCollection<T> {
	let e = entries || [];
	let tz = totalSize || e.length;
	let hasPreviousPage = page > 1;
	let previousPage = page > 1 ? page - 1 : 1;
	let hasNextPage = pageSize * page < tz;
	let nextPage = hasNextPage ? page + 1 : 1;
	let lastPage = hasNextPage ? Math.max(1, Math.ceil(tz / pageSize)) : 1;

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
export function emptyPaginatedCollection<T>(pageSize: number = 10): PaginatedCollection<T> {
	return newPaginatedCollection({ pageSize });
}
