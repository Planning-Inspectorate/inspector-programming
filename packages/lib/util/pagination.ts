/**
 * Determines the current page number by validating the requested page against the number of results
 */
export function getPageNumber(requestedPage: number, totalPages: number): number {
	//default to first page if not a number
	if (isNaN(+requestedPage)) return 1;
	//if desired page exceeds total pages, fallback to highest available page
	if (requestedPage > totalPages) return totalPages;
	return +requestedPage;
}

export function paginateList<T>(list: T[], page = 1, pageSize = 10): { list: T[]; total: number } {
	const skip = (page - 1) * pageSize;

	return {
		list: list.slice(skip, skip + pageSize),
		total: list.length || 0
	};
}
