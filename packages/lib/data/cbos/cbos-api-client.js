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
 * Client for interacting with the Manage appeals (CBOS) API, providing methods to fetch cases,
 * and handle caching and request timeouts.
 *
 * @module CbosApiClient
 */
export class CbosApiClient {
	/**
	 * Creates an instance of CbosApiClient.
	 * @param {import('./types.d.ts').ManageAppealsApiOptions} config
	 * @param {import('packages/lib/os/os-api-client').OsApiClient} osApiClient - Client for OS API
	 * @param {import('pino').Logger} logger - Logger instance for logging warnings and errors.
	 */
	constructor(config, osApiClient, logger) {
		if (!config.apiUrl) {
			throw new Error('apiUrl is required for CbosApiClient');
		}
		this.config = config;
		if (!this.config.apiHeader) {
			this.config.apiHeader = 'programme-appeals-system-user'; // placeholder user ID for api requests
		}
		if (!this.config.timeoutMs) {
			this.config.timeoutMs = 10000; // default to 10s
		}
		if (!this.config.appealTypesCachettl) {
			this.config.appealTypesCachettl = 1440; // default to 24h
		}
		this.appealTypesCache = new MapCache(this.config.appealTypesCachettl);
		this.logger = logger.child({ class: CbosApiClient.name });
		this.osApiClient = osApiClient;
	}

	/**
	 * Fetches and filters all unassigned cases
	 * @returns {Promise<{ cases: import('../types').AppealCaseModel[], caseReferences: string[] }>} An object containing the array of case view models.
	 * @throws {Error} If fetching cases fails.
	 */
	async getUnassignedCases({ pageNumber = 1, pageSize = 1000, fetchAll = true } = {}) {
		const logger = this.logger.child({ method: 'getUnassignedCases' });
		try {
			logger.debug({ pageNumber, pageSize, fetchAll }, 'fetchAppealReferences');
			const appealReferences = await this.fetchAppealReferences({ pageNumber, pageSize, fetchAll });
			logger.debug({ count: appealReferences.length }, 'got references');
			const [appealDetails, lpaData] = await Promise.all([
				this.fetchAppealDetailsByReference(appealReferences),
				this.fetchLpaData()
			]);
			logger.debug('got all appeal details');

			// Remove Parent cases with invalid statuses
			// TODO: can we filter before we do fetchAppealDetailsByReference ??
			const filteredData = appealDetails.filter(
				(item) =>
					item.isChildAppeal || (item.appealStatus && READY_TO_ASSIGN_APPEAL_STATUSES.includes(item.appealStatus))
			);
			logger.debug({ count: filteredData.length }, `filter out child cases and appeals which aren't ready`);
			const mappedAppeals = await Promise.all(filteredData.map((c) => this.appealToAppealCaseModel(c, lpaData)));
			const filteredCaseReferences = mappedAppeals.map((appeal) => appeal.caseReference);

			return { cases: mappedAppeals, caseReferences: filteredCaseReferences };
		} catch (error) {
			logger.error(error, 'error fetching all unassigned cases');
			throw error;
		}
	}

	/**
	 * Maps an appeal to appeal case for db
	 * @param {import('../types').CbosSingleAppealResponse} c - The appeal case object.
	 * @param {import('../types').CbosLpaResponse[]} lpaData
	 * @returns {Promise<import('../types').AppealCaseModel>} The mapped view model object.
	 */
	async appealToAppealCaseModel(c, lpaData) {
		let linkedCaseStatus = '',
			childCaseReferences = [],
			leadCaseReference;

		if (c.isParentAppeal && c.linkedAppeals) {
			linkedCaseStatus = 'Parent';
			for (let appeal of c.linkedAppeals) {
				if (appeal.appealReference) childCaseReferences.push({ caseReference: appeal.appealReference });
			}
		} else if (c.isChildAppeal && c.linkedAppeals) {
			linkedCaseStatus = 'Child';
			leadCaseReference = c.linkedAppeals[0].appealReference;
		}

		const lpa = lpaData.find((lpa) => lpa.name === c.localPlanningDepartment);
		const lpaCode = lpa ? lpa.lpaCode : '';

		const appealCoordinates = await this.getAppealCoordinates(c);

		return {
			caseId: c.appealId || '',
			caseReference: c.appealReference || '',
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
			lpaCode,
			lpaName: c.localPlanningDepartment || '',
			caseCreatedDate: c.createdAt ? new Date(c.createdAt) : null,
			caseValidDate: c.validAt ? new Date(c.validAt) : null,
			finalCommentsDueDate: c.appealTimetable?.finalCommentsDueDate
				? new Date(c.appealTimetable.finalCommentsDueDate)
				: null,
			linkedCaseStatus,
			leadCaseReference,
			childCaseReferences
			// appellantCostsAppliedFor
			// lpaCostsAppliedFor
			// inspectorId
			// Events
			// Specialisms
		};
	}

	/**
	 * Maps an appeal to appeal case for db
	 * @param {import('../types').CbosSingleAppealResponse} c - The appeal case object.
	 * @returns {Promise<{latitude: number | undefined, longitude: number | undefined}|undefined>} The mapped view model object.
	 */
	async getAppealCoordinates(c) {
		try {
			let latitude, longitude;
			const appealCoordinates = await this.osApiClient.addressesForPostcode(c.appealSite?.postCode);
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
			this.logger.error(error, `Failed to fetch postcode coordinates`);
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
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
			}
			throw error;
		}
	}

	/**
	 * Fetch appeal Data for a given Azure AD user.
	 * @returns {Promise<number[] | string[]>} Promise resolving to an array of appeal Data.
	 * @throws {Error} If fetching appeal Data fails.
	 */
	async #fetchAppealData({ pageNumber = 1, pageSize = 10, fetchAll = false } = {}) {
		try {
			/**
			 * @type {number[]}
			 */
			let allItems = [];
			let continueToFetch = true;
			while (continueToFetch) {
				const url = `${this.config.apiUrl}/appeals?hasInspector=false&pageNumber=${pageNumber}&pageSize=${pageSize}`;
				const response = await this.fetchWithTimeout(url);
				if (!response.ok) {
					throw new Error(`Failed to fetch appeal IDs. Status: ${response.status}`);
				}
				const data = await response.json();
				const maxPageNumber = data.pageCount;

				allItems.push(...data.items);

				if (fetchAll && pageNumber < maxPageNumber) {
					pageNumber += 1;
				} else {
					continueToFetch = false;
				}
			}

			return allItems;
		} catch (error) {
			/** @type {any} */
			//default error vals - stringified error or fallback val
			let message = String(error) || 'Unknown error';
			//if error comes from appeals backoffice api
			if (error && typeof error === 'object' && 'error' in error) message = error.error;
			//if error is an Error object with a message
			else if (error instanceof Error) message = error.message;

			throw new Error(`Failed to fetch appeal data: ${message}`);
		}
	}

	/**
	 * Fetch appeal IDs for a given Azure AD user.
	 * @returns {Promise<number[]>} Promise resolving to an array of appeal IDs.
	 * @throws {Error} If fetching appeal IDs fails.
	 */
	async fetchAppealIds(options) {
		try {
			const items = await this.#fetchAppealData(options);
			return items.map((item) => item.appealId);
		} catch (error) {
			throw new Error(`Failed to fetch appeal IDs: ${error.message}`);
		}
	}

	/**
	 * Fetch appeal References for a given Azure AD user.
	 * @returns {Promise<string[]>} Promise resolving to an array of appeal References.
	 * @throws {Error} If fetching appeal References fails.
	 */
	async fetchAppealReferences(options) {
		try {
			const items = await this.#fetchAppealData(options);
			return items.map((item) => item.appealReference);
		} catch (error) {
			throw new Error(`Failed to fetch appeal References: ${error.message}`);
		}
	}

	/**
	 * Fetch details for each appeal ID in parallel.
	 * @param {number[]} appealIds - Array of appeal IDs.
	 * @returns {Promise<import("../types").CbosSingleAppealResponse[]>} Promise resolving to an array of appeal detail objects.
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
	 * Fetch details for each appeal Reference in parallel.
	 * @param {string[]} appealReferences - Array of appeal References
	 * @returns {Promise<import("../types").CbosSingleAppealResponse[]>} Promise resolving to an array of appeal detail objects.
	 * @throws {Error} If fetching any appeal details fails.
	 */
	async fetchAppealDetailsByReference(appealReferences) {
		const detailPromises = appealReferences.map(async (appealReference) => {
			const url = `${this.config.apiUrl}/appeals/case-reference/${appealReference}`;
			const response = await this.fetchWithTimeout(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch details for appealReference ${appealReference}. Status: ${response.status}`);
			}
			return await response.json();
		});

		return await Promise.all(detailPromises); // Will throw if any promise rejects
	}

	/**
	 * Fetches the list of appeal types from the external API, with caching.
	 * @returns {Promise<import('../types').CbosAppealTypes[]>} Promise resolving to an array of appeal type objects.
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
			this.logger.error(
				`Error fetching appeal types from ${url}: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}

	/**
	 * Fetches latest lpa regions from cbos and updates database
	 * @returns {Promise<import('../types').CbosLpaResponse[]>}
	 */
	async fetchLpaData() {
		const url = `${this.config.apiUrl}/appeals/local-planning-authorities`;

		try {
			const response = await this.fetchWithTimeout(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch local planning authorities from ${url}. Status: ${response.status}`);
			}

			return response.json();
		} catch (error) {
			this.logger.error(
				`Error fetching local planning authorities from ${url}: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}

	/**
	 * Gets the display key for a given appeal type, fetching and caching appeal types if needed.
	 * @param {string | undefined} appealType - The appeal type identifier.
	 * @returns {Promise<string>} The display key for the appeal type, or 'Unknown Appeal Type' if not found.
	 */
	async getAppealType(appealType) {
		const appealTypes = await this.fetchAppealTypes();
		const found = appealTypes.find((item) => item.type === appealType);
		return found ? found.key : 'Unknown Appeal Type';
	}

	/**
	 *
	 * @param {number} appealId
	 * @param {object} appealData
	 */
	async patchAppeal(appealId, appealData) {
		const url = `${this.config.apiUrl}/appeals/${appealId}`;
		const defaultHeaders = {
			'Content-Type': 'application/json',
			azureAdUserId: this.config.apiHeader
		};

		try {
			const response = await fetch(url, {
				method: 'PATCH',
				headers: defaultHeaders,
				body: JSON.stringify(appealData)
			});

			if (response.ok) {
				this.logger.info(`Successfully updated appealID ${appealId}`);
			} else {
				this.logger.error(`Failed to update appealID ${appealId} at ${url}. Status: ${response.status}`);
				throw new Error(`Failed to update appealID ${appealId} at ${url}. Status: ${response.status}`);
			}
		} catch (error) {
			this.logger.error(`Failed to update appealID ${appealId} at ${url}:`, error.message);
			throw error;
		}
	}
}
