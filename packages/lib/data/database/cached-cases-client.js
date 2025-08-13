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

	/**
	 * Fetch a paginated list of appeal cases from the database. ---  TEMPORARY
	 *
	 * @param {number} page - The current page number (1-based).
	 * @param {number} pageSize - The number of cases per page.
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number }>}
	 */
	async getPaginatedCases(page = 1, pageSize = 10) {
		return this.#client.getPaginatedCases(page, pageSize);
	}
}
