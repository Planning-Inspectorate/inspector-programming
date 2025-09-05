import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

const READY_TO_ASSIGN_APPEAL_STATUSES = [
	APPEAL_CASE_STATUS.READY_TO_START,
	APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
	APPEAL_CASE_STATUS.STATEMENTS,
	APPEAL_CASE_STATUS.FINAL_COMMENTS,
	APPEAL_CASE_STATUS.EVENT,
	APPEAL_CASE_STATUS.EVIDENCE,
	APPEAL_CASE_STATUS.WITNESSES
];

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
	 * @typedef {import('@pins/inspector-programming-lib/os/os-api-client.js')} OsApiClient
	 */

	/**
	 * Creates an instance of CbosApiClient.
	 * @param {Object} cbosConfig - Configuration object for the API client.
	 * @param {string} cbosConfig.apiUrl - Base URL for the CBOS API.
	 * @param {string} cbosConfig.apiHeader - Azure AD user ID header value.
	 * @param {number} cbosConfig.timeoutMs - Timeout for API requests in milliseconds.
	 * @param {number} cbosConfig.appealTypesCachettl - TTL for the appeal types cache.
	 * @param {OsApiClient} osApiClient - Client for OS API
	 * @param {Object} logger - Logger instance for logging warnings and errors.
	 */
	constructor(cbosConfig, osApiClient, logger) {
		this.config = cbosConfig;
		this.appealTypesCache = new MapCache(this.config.appealTypesCachettl);
		this.logger = logger;
		this.osApiClient = osApiClient;
	}

	/**
	 * Fetches and filters all unassigned cases
	 * @returns {Promise<{ cases: Object[], caseReferences: string[] }>} An object containing the array of case view models.
	 * @throws {Error} If fetching cases fails.
	 */
	async getUnassignedCases({ pageNumber = 1, pageSize = 1000, fetchAll = true } = {}) {
		try {
			const appealIds = await this.fetchAppealIds({ pageNumber, pageSize, fetchAll });
			const appealDetails = await this.fetchAppealDetails(appealIds);
			const mappedAppeals = await Promise.all(appealDetails.map((c) => this.appealToAppealCaseModel(c)));
			const filteredCaseReferences = [];
			for (const appeal of mappedAppeals) {
				filteredCaseReferences.push(appeal.caseReference);
			}

			return { cases: mappedAppeals, caseReferences: filteredCaseReferences };
		} catch (error) {
			this.logger.error({ error: error }, '[CaseController] Error fetching case details');
			throw new Error('Failed to fetch cases. Please try again later.');
		}
	}

	/**
	 * Maps an appeal to appeal case for db
	 * @param {Object} c - The appeal case object.
	 * @returns {Promise<Object>} The mapped view model object.
	 */
	async appealToAppealCaseModel(c) {
		let linkedCaseStatus, leadCaseReference;

		if (c.isParentAppeal) {
			linkedCaseStatus = 'Parent';
		} else if (c.isChildAppeal) {
			linkedCaseStatus = 'Child';
			// TODO - process c.linkedAppeals here
			leadCaseReference = '';
		}

		const appealCoordinates = await this.getAppealCoordinates(c);

		return {
			caseId: c.appealId,
			caseReference: c.appealReference,
			caseType: (await this.getAppealType(c.appealType)) || '',
			caseStatus: c.appealStatus || 'Unassigned',
			caseProcedure: c.procedureType || '',
			originalDevelopmentDescription: '',
			allocationLevel: c.allocationDetails?.level || '',
			allocationBand: c.allocationDetails?.band,
			siteAddressLine1: c.appealSite?.addressLine1 || '',
			siteAddressLine2: c.appealSite?.addressLine2 || '',
			siteAddressTown: '',
			siteAddressCounty: c.appealSite?.county || '',
			siteAddressPostcode: c.appealSite?.postCode || '',
			siteAddressLatitude: appealCoordinates?.latitude,
			siteAddressLongitude: appealCoordinates?.longitude,
			lpaCode: '', // TODO - fetch from /appeals/local-planning-authorities
			lpaName: c.localPlanningDepartment || '',
			lpaRegion: c.lpaRegion || '',
			caseCreatedDate: c.createdAt,
			caseValidDate: c.validAt,
			finalCommentsDueDate: c.appealTimetable?.finalCommentsDueDate
				? new Date(c.appealTimetable.finalCommentsDueDate)
				: null,
			linkedCaseStatus,
			leadCaseReference
			// appellantCostsAppliedFor
			// lpaCostsAppliedFor
			// inspectorId
			// Events
			// Specialisms
		};
	}

	/**
	 * Maps an appeal to appeal case for db
	 * @param {Object} c - The appeal case object.
	 * @returns {Promise<Object|undefined>} The mapped view model object.
	 */
	async getAppealCoordinates(c) {
		try {
			let latitude, longitude;
			const appealCoordinates = await this.osApiClient.addressesForPostcode(c.appealSite.postCode);
			if (appealCoordinates.results && appealCoordinates.results.length > 0) {
				const locationData = appealCoordinates.results[0];
				if ('DPA' in locationData) {
					latitude = locationData.DPA.LAT;
					longitude = locationData.DPA.LNG;
				} else if ('LPI' in locationData) {
					latitude = locationData.LPI.LAT;
					longitude = locationData.LPI.LNG;
				}
				return { latitude, longitude };
			}
		} catch (error) {
			this.logger.error(`Failed to fetch postcode coordinates: ${error}`);
		}
	}

	/**
	 * Fetches all cases for the user.
	 * @returns {Promise<{ cases: Object[] }>} An object containing the array of case view models.
	 * @throws {Error} If fetching cases fails.
	 */
	async getCases({ pageNumber = 1, pageSize = 10 } = {}) {
		try {
			const appealIds = await this.fetchAppealIds({ pageNumber, pageSize });
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
	 * Returns the count of linked appeals for a case.
	 * @param {Object} c - Case object containing linkedAppeals array.
	 * @returns {number} Count of linked cases, or 0 if the array is empty or missing.
	 */
	getLinkedCasesCount(c) {
		return Array.isArray(c.linkedAppeals) ? c.linkedAppeals.length : 0;
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
	 * @returns {Promise<number[]>} Promise resolving to an array of appeal IDs.
	 * @throws {Error} If fetching appeal IDs fails.
	 */
	async fetchAppealIds({ pageNumber = 1, pageSize = 10, fetchAll = false } = {}) {
		try {
			/**
			 * @type {number[]}
			 */
			let appealIds = [];
			let continueToFetch = true;
			while (continueToFetch) {
				const url = `${this.config.apiUrl}/appeals?hasInspector=false&pageNumber=${pageNumber}&pageSize=${pageSize}`;
				const response = await this.fetchWithTimeout(url);
				if (!response.ok) {
					throw new Error(`Failed to fetch appeal IDs. Status: ${response.status}`);
				}
				const data = await response.json();
				const maxPageNumber = data.pageCount;

				const filteredData = data.items?.filter((item) => READY_TO_ASSIGN_APPEAL_STATUSES.includes(item.appealStatus));

				for (let item of filteredData) {
					appealIds.push(item.appealId);
				}

				if (fetchAll && pageNumber < maxPageNumber) {
					pageNumber += 1;
				} else {
					continueToFetch = false;
				}
			}

			return appealIds;
		} catch (error) {
			const message = error?.error || error?.message || 'Failed to fetch appeal IDs';
			throw new Error(`Failed to fetch appeal IDs: ${message}`);
		}
	}

	/**
	 * Fetch details for each appeal ID in parallel.
	 * @param {number[]} appealIds - Array of appeal IDs.
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
