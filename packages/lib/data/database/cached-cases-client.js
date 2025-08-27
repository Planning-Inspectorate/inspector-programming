import { CasesClient } from './cases-client.js';
import { sortCasesByAge, sortCasesByDistance } from '../../util/sorting.js';
import { filterCases } from '../../util/filtering.js';

const CACHE_PREFIX = 'cases_';

/**
 * @typedef {import('../../util/map-cache.js').MapCache} MapCache
 */

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 * @param {MapCache} cache
 * @returns {CachedCasesClient}
 */
export function buildInitCasesClient(dbClient, cache) {
	const casesClient = new CasesClient(dbClient);
	return new CachedCasesClient(casesClient, cache);
}

/**
 * Wraps the CasesClient with a cache
 */
export class CachedCasesClient {
	/** @type {CasesClient} */
	#client;
	/** @type {MapCache} */
	#cache;

	/**
	 *
	 * @param {CasesClient} client
	 * @param {MapCache} cache
	 */
	constructor(client, cache) {
		this.#client = client;
		this.#cache = cache;
	}

	/**
	 * Retrieve appeals cases while supporting sorting, filtering (TODO) and pagination functionality
	 * Fetches all cases from cache if there, then applies sort and filtering (TODO) before paginating the resultant cases
	 * Ideal entry point for fetching cases from the frontend
	 *
	 * @param {import('../types.js').Filters} filters
	 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
	 * @param {number} page
	 * @param {number} pageSize
	 * @param {import("@pins/inspector-programming-lib/data/types").InspectorViewModel|undefined} selectedInspector
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number }>}
	 */
	async getCases(filters, sort, page, pageSize, selectedInspector) {
		const allCases = await this.getAllCases();

		//filter
		const filteredCases = filterCases(allCases, filters);

		//sort
		let sortedCases;
		const inspectorCoords = { lat: selectedInspector?.latitude || null, lng: selectedInspector?.longitude || null };
		switch (sort) {
			case 'distance':
				sortedCases = filteredCases.sort((a, b) => sortCasesByDistance(inspectorCoords, a, b));
				break;
			case 'hybrid':
				//WIP
				sortedCases = filteredCases;
				break;
			default:
				sortedCases = filteredCases.sort(sortCasesByAge);
				break;
		}

		//paginate
		return this.#client.paginateCases(sortedCases, page, pageSize);
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const key = CACHE_PREFIX + 'getAllCases';
		let cases = this.#cache.get(key);
		if (cases) {
			return cases;
		}
		cases = await this.#client.getAllCases();
		this.#cache.set(key, cases);
		return cases;
	}
}
