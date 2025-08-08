/**
 * Client for fetching case data from the Prisma database for the application,
 *
 * @module CasesClient
 */
export class CasesClient {
	/** @type {import('@pins/inspector-programming-database/src/client').PrismaClient} */
	#client;
	/** @type {import('@pins/inspector-programming-lib/os/os-api-client').OsApiClient} */
	#osClient;

	/**
	 *
	 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
	 * @param {import('@pins/inspector-programming-lib/os/os-api-client').OsApiClient} osClient
	 */
	constructor(dbClient, osClient) {
		this.#client = dbClient;
		this.#osClient = osClient;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const cases = await this.#client.appealCase.findMany();
		const processedCases = await this.processCases(cases);
		return processedCases.map((c) => this.caseToViewModel(c));
	}

	/**
	 * Process cases to allow for additional calculations and values to be computed
	 * @param {import('@pins/inspector-programming-database/src/client').AppealCase[]} cases
	 * @returns {Promise<import('../types').ProcessedAppealCase[]>}
	 */
	async processCases(cases) {
		/** @type {import('../types').ProcessedAppealCase[]} */
		let processedCases = [];
		const chunkedCases = this.chunkArray(cases, 5);
		for (const caseChunk of chunkedCases) {
			const chunkCoords = await Promise.all(
				caseChunk.map(async (c) => {
					try {
						const coords = await this.getCaseCoordinates(c.siteAddressPostcode);
						return { ...c, ...coords };
					} catch (err) {
						//if error occurs getting coords from os api then leave lat and long null
						console.error(err);
						return { ...c, lat: null, lng: null };
					}
				})
			);
			processedCases = [...processedCases, ...chunkCoords];
		}
		return processedCases;
	}

	/**
	 * Maps a case object to a view model for UI consumption.
	 * @param {import('../types').ProcessedAppealCase} c
	 * @returns {import('../types').CaseViewModel}
	 */
	caseToViewModel(c) {
		console.info(c);
		return {
			caseId: c.caseReference,
			caseType: c.caseType || '',
			caseProcedure: c.caseProcedure || '',
			allocationBand: c.allocationBand || '',
			caseLevel: c.allocationLevel || '',
			siteAddressPostcode: c.siteAddressPostcode || '',
			lpaName: typeof c.lpaName === 'string' ? c.lpaName : '',
			lpaRegion: typeof c.lpaRegion === 'string' ? c.lpaRegion : '',
			caseStatus: c.caseStatus || 'Unassigned',
			caseAge: this.getCaseAgeInWeeks(c.caseValidDate || new Date()),
			linkedCases: this.getLinkedCasesCount(c),
			finalCommentsDate: c.finalCommentsDueDate instanceof Date ? c.finalCommentsDueDate : new Date(),
			lat: c.lat,
			lng: c.lng
		};
	}

	/**
	 * Fetches latitude and longitude coordinates for a case postcode
	 * @param {*} postcode
	 * @returns {Promise<{lat: number | null, lng: number | null}>}
	 */
	async getCaseCoordinates(postcode) {
		//postcodes cover multiple properties (UPRNs) - only grab the first address under the postcode
		const addressInfo = (await this.#osClient.addressesForPostcode(postcode)).results[0];
		//LPI data is more precise
		const record = 'LPI' in addressInfo ? addressInfo.LPI : addressInfo.DPA;
		return { lat: record.LAT ?? null, lng: record.LNG ?? null };
	}

	/**
	 * Fairly accurate distance calculation using the Haversine formula
	 *
	 * @param {import('../types').LatLong} latLongA
	 * @param {import('../types').LatLong} latLongB
	 * @returns {number} Distance in km
	 */
	distanceBetween(latLongA, latLongB) {
		const earthRadius = 6371;
		const latDiff = ((latLongB.lat - latLongA.lat) * Math.PI) / 180;
		const longDiff = ((latLongB.lng - latLongA.lng) * Math.PI) / 180;
		const a =
			Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
			Math.cos((latLongA.lat * Math.PI) / 180) *
				Math.cos((latLongB.lat * Math.PI) / 180) *
				Math.sin(longDiff / 2) *
				Math.sin(longDiff / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return earthRadius * c;
	}

	/**
	 * Returns the number of linked appeals for a case.
	 * @param {import('@pins/inspector-programming-database/src/client').AppealCase | import('../types').ProcessedAppealCase} c
	 * @returns {number}
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
	 * Fetch a paginated list of appeal cases from the database.
	 *
	 * @param {number} page - The current page number (1-based).
	 * @param {number} pageSize - The number of cases per page.
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number }>}
	 */
	async getPaginatedCases(page = 1, pageSize = 10) {
		const skip = (page - 1) * pageSize;

		const [cases, total] = await Promise.all([
			this.#client.appealCase.findMany({
				skip,
				take: pageSize
			}),
			this.#client.appealCase.count()
		]);

		return {
			cases: cases.map((c) => this.caseToViewModel(c)),
			total
		};
	}

	/**
	 * chunks array into sub-arrays for batch processing
	 * @param {any[]} array
	 * @param {number} chunkSize
	 * @returns
	 */
	chunkArray(array, chunkSize) {
		const chunks = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}
}
