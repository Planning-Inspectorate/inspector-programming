/**
 * @param {import('express').Request} req
 * @param {number} total
 * @param {{page: number, limit: number}} formData
 * @returns {import('#util/types.js').Pagination}
 */
export function paginationValues(req, total, formData) {
	const page = formData.page;
	const limit = formData.limit;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const params = { ...req.query, page: undefined };

	return {
		previous: page > 1 ? { href: buildQueryString(params, page - 1) } : null,
		next: page < totalPages ? { href: buildQueryString(params, page + 1) } : null,
		items: createPaginationItems(page, totalPages, params)
	};
}

/**
 * @param {Object} params
 * @param {number} newPage
 * @returns {string}
 */
export function buildQueryString(params, newPage) {
	const updatedParams = { ...params, page: newPage };
	const searchParams = new URLSearchParams();
	Object.entries(updatedParams).forEach(([key, value]) => {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			Object.entries(value).forEach(([nestedKey, nestedValue]) => {
				appendParam(searchParams, `${key}[${nestedKey}]`, nestedValue);
			});
		} else {
			appendParam(searchParams, key, value);
		}
	});
	return '?' + searchParams.toString();
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {string | number | Array<string | number>} value
 */
export function appendParam(searchParams, key, value) {
	if (Array.isArray(value)) {
		value.forEach((v) => searchParams.append(key, v));
	} else if (value !== undefined && value !== null) {
		searchParams.append(key, value);
	}
}

/**
 * @param {number} page .
 * @param {number} totalPages
 * @param {Object} params
 * @returns {import('#util/types.js').PaginationItem[]}
 */
export function createPaginationItems(page, totalPages, params) {
	/** @type {import('#util/types.js').PaginationItem[]}*/
	const items = [];
	/**
	 * @param {number} n
	 */
	const addPage = (n) =>
		items.push({
			number: n,
			href: buildQueryString(params, n),
			current: page === n
		});
	const addEllipsis = () => items.push({ ellipsis: true });

	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) addPage(i);
	} else {
		addPage(1);
		if (page > 4) addEllipsis();

		const start = Math.max(2, page - 2);
		const end = Math.min(totalPages - 1, page + 2);

		for (let i = start; i <= end; i++) addPage(i);

		if (page < totalPages - 3) addEllipsis();
		addPage(totalPages);
	}

	return items;
}
