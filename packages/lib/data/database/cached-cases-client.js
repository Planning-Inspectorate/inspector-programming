import { CasesClient } from './cases-client.js';
import { sortCasesByAge, sortCasesByDistance } from '../../util/sorting.js';
import { filterCases } from '../../util/filtering.js';
import { filterAssignableCases } from './appeal-status.js';
import { getPageNumber, paginateList } from '../../util/pagination.ts';

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
 * @returns {CachedCasesClient}
 */
export function buildInitCasesClient(dbClient) {
	const casesClient = new CasesClient(dbClient);
	return new CachedCasesClient(casesClient);
}

/**
 * Wraps the CasesClient with a cache
 */
export class CachedCasesClient {
	/** @type {CasesClient} */
	#client;
	/** @type {import('../types').CaseViewModel[]|undefined} */
	#_cachedCases;
	/** @type {Date|undefined} */
	#_cachedCasesUpdatedAt;
	/** @type {import('../types').CaseViewModel[]|undefined} */
	#_cachedUnassignableCases;

	/**
	 *
	 * @param {CasesClient} client
	 */
	constructor(client) {
		this.#client = client;
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
		const validatedCases = filterAssignableCases(allCases);

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
	async getUnassignableCases() {
		const shouldTryCache = await this.shouldTryCache();
		if (shouldTryCache) {
			if (this.#_cachedUnassignableCases) {
				return this.#_cachedUnassignableCases;
			}
		}
		const allCases = await this.getAllCases();
		const cases = await this.#client.getUnassignableCases(allCases);
		this.#_cachedUnassignableCases = cases;
		return cases;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const shouldTryCache = await this.shouldTryCache();
		if (shouldTryCache) {
			if (this.#_cachedCases) {
				return this.#_cachedCases;
			}
		}
		const cases = await this.#client.getAllCases();
		this.#cachedCases = cases;
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
		return cases.find((item) => item.caseId === caseId);
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
		return cases.filter((item) => item.linkedCaseStatus !== 'Child');
	}

	/**
	 *
	 * @param {number[]} caseIds
	 */
	async deleteCases(caseIds) {
		await this.#client.deleteCases(caseIds);

		let cases = this.#_cachedCases;

		if (cases) {
			cases = cases.filter((/** @type {{ caseId: number; }} */ appeal) => !caseIds.includes(appeal.caseId));
			this.#cachedCases = cases;
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
		if (!this.#_cachedCasesUpdatedAt) {
			return false; // no cached result, so don't use the cache
		}
		// if latest poll is before the latest fetch, we can use the cache
		return latestPoll < this.#_cachedCasesUpdatedAt;
	}

	set #cachedCases(cases) {
		this.#_cachedCases = cases;
		this.#_cachedCasesUpdatedAt = new Date();
	}
}
