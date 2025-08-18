import { CasesClient } from './cases-client.js';

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
	 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
	 * @param {number} page
	 * @param {number} pageSize
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number }>}
	 */
	async getCases(sort, page, pageSize) {
		const allCases = await this.getAllCases();

		//sort
		let sortedCases;
		switch (sort) {
			case 'distance':
				//WIP
				sortedCases = allCases;
				break;
			case 'hybrid':
				//WIP
				sortedCases = allCases;
				break;
			default:
				sortedCases = allCases.sort((a, b) => {
					const ageComparison = b.caseAge - a.caseAge;
					if (ageComparison !== 0) return ageComparison;
					const dateReceivedComparison =
						b.caseReceivedDate && a.caseReceivedDate
							? (new Date(a.caseReceivedDate)?.getTime() || 0) - (new Date(b.caseReceivedDate)?.getTime() || 0)
							: 0;
					return dateReceivedComparison !== 0
						? dateReceivedComparison
						: (a.lpaName || '').localeCompare(b.lpaName || '', undefined, { sensitivity: 'base' });
				});
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
