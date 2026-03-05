import { CasesClient } from './cases-client.js';
import { sortCasesByAge, sortCasesByDistance } from '../../util/sorting.js';
import { filterCases } from '../../util/filtering.js';
import { filterExcludedStatuses } from './appeal-status.js';
import { getPageNumber, paginateList } from '../../util/pagination.ts';

const CACHE_PREFIX = 'cases_';
/**
 * @typedef {import('../../util/map-cache.js').MapCache} MapCache
 */

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
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
	 * @param {string} sort - The sort criteria, can be 'distance' or 'age'.
	 * @param {number} page
	 * @param {number} pageSize
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number, page: number }>}
	 */
	async getCases(filters, sort, page, pageSize) {
		const allCases = await this.getAllParentCases();

		// get validated cases
		const validatedCases = filterExcludedStatuses(allCases);

		//filter
		const filteredCases = filterCases(validatedCases, filters);

		//sort
		let sortedCases;
		switch (sort) {
			case 'distance':
				sortedCases = filteredCases.sort((a, b) => sortCasesByDistance(filters.inspectorCoordinates, a, b));
				break;
			default:
				sortedCases = filteredCases.sort(sortCasesByAge);
				break;
		}

		//paginate and validate page number based on number of results
		const totalPages = Math.max(1, Math.ceil((sortedCases.length || 0) / pageSize)) || 1;
		const processedPage = getPageNumber(page, totalPages);
		const paginatedResults = paginateList(sortedCases, processedPage, pageSize);
		return { cases: paginatedResults.list, total: paginatedResults.total, page: processedPage };
	}

	/**
	 * Fetch all appeals cases which cannot be assigned
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getUnassignedCases() {
		const shouldTryCache = await this.shouldTryCache();
		const key = CACHE_PREFIX + 'getUnassignedCases';
		if (shouldTryCache) {
			const cases = this.#cache.get(key);
			if (cases) {
				return cases;
			}
		}
		const allCases = await this.getAllCases();
		const cases = await this.#client.getUnassignableCases(allCases);
		this.#cache.set(key, cases);
		return cases;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const shouldTryCache = await this.shouldTryCache();
		const key = CACHE_PREFIX + 'getAllCases';
		if (shouldTryCache) {
			const cases = this.#cache.get(key);
			if (cases) {
				return cases;
			}
		}
		const cases = await this.#client.getAllCases();
		this.#cache.set(key, cases);
		return cases;
	}

	/**
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.AppealCaseGetPayload<{ include: { ChildCases: true, Specialisms: true } }>} c
	 * @returns {import('../types').CaseViewModel}
	 */
	caseToViewModel(c) {
		return this.#client.caseToViewModel(c);
	}

	/**
	 *
	 * @param {number} caseId
	 * @returns {Promise<import('../types').CaseViewModel|undefined>}
	 */
	async getCaseById(caseId) {
		const cases = await this.getAllCases();
		return cases.find((item) => item.caseId == caseId);
	}

	/**
	 *
	 * @param {number[]} caseIds
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getCasesByIds(caseIds) {
		const cases = await this.getAllCases();
		return cases.filter((item) => item.caseId && caseIds.includes(item.caseId));
	}

	async getAllParentCases() {
		const cases = await this.getAllCases();
		return cases.filter((item) => item.linkedCaseStatus != 'Child');
	}

	/**
	 *
	 * @param {number[]} caseIds
	 */
	async deleteCases(caseIds) {
		await this.#client.deleteCases(caseIds);

		const key = CACHE_PREFIX + 'getAllCases';
		let cases = this.#cache.get(key);

		if (cases) {
			cases = cases.filter((/** @type {{ caseId: number; }} */ appeal) => !caseIds.includes(appeal.caseId));
			this.#cache.set(key, cases);
		}
	}

	/**
	 * Returns whether to use the cache value or fetch a new value, based on the latest database update
	 * @returns {Promise<boolean>}
	 */
	async shouldTryCache() {
		const latestPoll = await this.#client.lastCasesUpdate();
		if (!latestPoll) {
			return true; // no updates, so use cache
		}
		const oldestEntry = new Date();
		oldestEntry.setTime(oldestEntry.getTime() - this.#cache.cacheTtlMs);
		// if latest poll is before the oldest entry, then we can use the cache
		return latestPoll < oldestEntry;
	}
}
