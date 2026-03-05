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
