import { CasesClient } from './cases-client.js';
import { sortCasesByAge, sortCasesByDistance } from '../../util/sorting.js';
import { filterCases } from '../../util/filtering.js';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

/**
 * Statuses to filter out from the case list
 * @type {string[]}
 */
const EXCLUDED_APPEAL_STATUSES = [APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER, APPEAL_CASE_STATUS.VALIDATION];

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
		const validatedCases = this.getValidatedCases(allCases);

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
		const processedPage = this.determinePage(page, totalPages);
		const paginatedResults = await this.#client.paginateCases(sortedCases, processedPage, pageSize);
		return { ...paginatedResults, page: processedPage };
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
	 * Determines the current page number by validating the requested page against the number of results
	 * @param {number} requestedPage
	 * @param {number} totalPages
	 * @returns {number}
	 */
	determinePage(requestedPage, totalPages) {
		//default to first page if not a number
		if (isNaN(+requestedPage)) return 1;
		//if desired page exceeds total pages, fallback to highest available page
		if (requestedPage > totalPages) return totalPages;
		return +requestedPage;
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
	 * @param {string} caseId
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getLinkedCasesByParentCaseId(caseId) {
		const cases = await this.getAllCases();
		return cases.filter((item) => item.leadCaseReference == caseId);
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
	 * @param {import('../types').CaseViewModel[]} cases
	 * @returns {import('../types').CaseViewModel[]}
	 */
	getValidatedCases(cases) {
		return cases.filter((item) => !EXCLUDED_APPEAL_STATUSES.includes(item.caseStatus));
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
