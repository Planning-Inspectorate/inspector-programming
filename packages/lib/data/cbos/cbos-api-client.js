import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';

/**
 * Client for interacting with the CBOS API, providing methods to fetch cases,
 * and handle caching and request timeouts.
 *
 * @module CbosApiClient
 */
export class CbosApiClient {
	/**
	 * Static cache for appeal types, shared across all instances.
	 * @type {?Object[]}
	 */
	static appealTypesCache = null;

	/**
	 * Static promise for fetching appeal types, to prevent duplicate requests.
	 * @type {?Promise<Object[]>}
	 */
	static fetchPromise = null;

	/**
	 * Creates an instance of CbosApiClient.
	 * @param {Object} cbosConfig - Configuration object for the API client.
	 * @param {string} cbosConfig.apiUrl - Base URL for the CBOS API.
	 * @param {string} cbosConfig.apiHeader - Azure AD user ID header value.
	 * @param {number} cbosConfig.timeoutMs - Timeout for API requests in milliseconds.
	 * @param {number} cbosConfig.appealTypesCachettl - TTL for the appeal types cache.
	 * @param {Object} logger - Logger instance for logging warnings and errors.
	 */
	constructor(cbosConfig, logger) {
		this.config = cbosConfig;
		this.appealTypesCache = new MapCache(this.config.appealTypesCachettl);
		this.logger = logger;
	}

	/**
	 * Fetches all cases for the user.
	 * @returns {Promise<{ cases: Object[] }>} An object containing the array of case view models.
	 * @throws {Error} If fetching cases fails.
	 */
	async getCases() {
		try {
			const appealIds = await this.fetchAppealIds();
			if (appealIds.length === 0) {
				this.logger.warn('[CaseController] No appeal IDs found for the user.');
			}
			const appealDetails = await this.fetchAppealDetails(appealIds);
			return await Promise.all(appealDetails.map((c) => this.appealToViewModel(c)));
		} catch (error) {
			this.logger.error({ error: error }, '[CaseController] Error fetching cases');
			throw new Error('Failed to fetch cases. Please try again later.');
		}
	}

	/**
	 * Fetch wrapper with timeout.
	 * @param {string} url - The URL to fetch.
	 * @param {Object} options - Fetch options (currently unused).
	 * @param {number} timeout - Timeout in milliseconds.
	 * @returns {Promise<Response>} The fetch response.
	 * @throws {Error} If the request times out or fails.
	 */
	async fetchWithTimeout(url) {
		const defaultHeaders = {
			'Content-Type': 'application/json',
			azureAdUserId: this.config.apiHeader
		};
		const timeoutMs = this.config.timeoutMs;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: defaultHeaders,
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error.name === 'AbortError') {
				throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
			}
			throw error;
		}
	}

	/**
	 * Maps an appeal case object to a view model for UI consumption.
	 * @param {Object} c - The appeal case object.
	 * @returns {Object} The mapped view model object.
	 */
	async appealToViewModel(c) {
		return {
			caseId: c.appealReference,
			caseType: (await this.getAppealType(c.appealType)) || '',
			caseProcedure: c.procedureType || '',
			allocationBand: c.allocationDetails?.band || '',
			caseLevel: c.allocationDetails?.level || '',
			siteAddressPostcode: c.appealSite?.postCode || '',
			lpaName: c.localPlanningDepartment || '',
			lpaRegion: c.lpaRegion || '',
			caseStatus: c.appealStatus || 'Unassigned',
			caseAge: this.getCaseAgeInWeeks(c.validAt),
			linkedCases: this.getLinkedCasesCount(c),
			finalCommentsDate: c.appealTimetable?.finalCommentsDueDate
				? new Date(c.appealTimetable.finalCommentsDueDate)
				: new Date()
			// programmingStatus: c.programmingStatus || ''
		};
	}

	/**
	 * Returns the total count of linked and other appeals for a case.
	 * @param {Object} c - Case object containing linkedAppeals and otherAppeals arrays.
	 * @returns {number} Total count of linked cases, or 0 if both arrays are empty.
	 */
	getLinkedCasesCount(c) {
		const linkedCount = Array.isArray(c.linkedAppeals) ? c.linkedAppeals.length : 0;
		const otherCount = Array.isArray(c.otherAppeals) ? c.otherAppeals.length : 0;
		return linkedCount + otherCount;
	}

	/**
	 * Calculates the case age in weeks from the valid date.
	 * @param {string|Date} validDate - The valid date of the case.
	 * @returns {number} Age in weeks (rounded down).
	 */
	getCaseAgeInWeeks(validDate) {
		if (!validDate) return 0;
		const startDate = new Date(validDate);
		const now = new Date();
		const msPerWeek = 7 * 24 * 60 * 60 * 1000;
		const diffMs = now - startDate;
		return diffMs < 0 ? 0 : Math.floor(diffMs / msPerWeek);
	}

	/**
	 * Fetch appeal IDs for a given Azure AD user.
	 * @returns {Promise<string[]>} Promise resolving to an array of appeal IDs.
	 * @throws {Error} If fetching appeal IDs fails.
	 */
	async fetchAppealIds() {
		const url = `${this.config.apiUrl}/appeals?hasInspector=false`;
		try {
			const response = await this.fetchWithTimeout(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch appeal IDs. Status: ${response.status}`);
			}
			const data = await response.json();
			return data.items?.map((item) => item.appealId) || [];
		} catch (error) {
			const message = error?.error || error?.message || 'Failed to fetch appeal IDs';
			throw new Error(`Failed to fetch appeal IDs: ${message}`);
		}
	}

	/**
	 * Fetch details for each appeal ID in parallel.
	 * @param {string[]} appealIds - Array of appeal IDs.
	 * @returns {Promise<Object[]>} Promise resolving to an array of appeal detail objects.
	 * @throws {Error} If fetching any appeal details fails.
	 */
	async fetchAppealDetails(appealIds) {
		const detailPromises = appealIds.map(async (appealId) => {
			const url = `${this.config.apiUrl}/appeals/${appealId}`;
			const response = await this.fetchWithTimeout(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch details for appealId ${appealId}. Status: ${response.status}`);
			}
			return await response.json();
		});

		return await Promise.all(detailPromises); // Will throw if any promise rejects
	}

	/**
	 * Fetches the list of appeal types from the external API, with caching.
	 * @returns {Promise<Object[]>} Promise resolving to an array of appeal type objects.
	 * @throws {Error} If the request fails or the response is not OK.
	 */
	async fetchAppealTypes() {
		const cacheKey = 'appealTypes';
		const cached = this.appealTypesCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		const url = `${this.config.apiUrl}/appeals/appeal-types`;
		try {
			const response = await this.fetchWithTimeout(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch appeal types from ${url}. Status: ${response.status}`);
			}

			const data = await response.json();
			this.appealTypesCache.set(cacheKey, data);
			return data;
		} catch (error) {
			this.logger.error(`Error fetching appeal types from ${url}:`, error.message);
			throw error;
		}
	}

	/**
	 * Gets the display key for a given appeal type, fetching and caching appeal types if needed.
	 * @param {string} appealType - The appeal type identifier.
	 * @returns {Promise<string>} The display key for the appeal type, or 'Unknown Appeal Type' if not found.
	 */
	async getAppealType(appealType) {
		if (!CbosApiClient.appealTypesCache) {
			if (!CbosApiClient.fetchPromise) {
				CbosApiClient.fetchPromise = this.fetchAppealTypes().then((data) => {
					CbosApiClient.appealTypesCache = data;
					return data;
				});
			}
			await CbosApiClient.fetchPromise;
		}
		const found = CbosApiClient.appealTypesCache.find((item) => item.type === appealType);
		return found ? found.key : 'Unknown Appeal Type';
	}
}
