/**
 * Client for fetching case data from the Prisma database for the application,
 *
 * @module CasesClient
 */
export class CasesClient {
	/** @type {import('@pins/inspector-programming-database/src/client').PrismaClient} */
	#client;

	/**
	 *
	 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const cases = await this.#client.appealCase.findMany();
		return cases.map((c) => this.caseToViewModel(c));
	}

	/**
	 * Maps a case object to a view model for UI consumption.
	 * @param {import('@pins/inspector-programming-database/src/client').AppealCase} c
	 * @returns {import('../types').CaseViewModel}
	 */
	caseToViewModel(c) {
		return {
			caseId: c.caseReference,
			caseType: c.caseType || '',
			caseProcedure: c.caseProcedure || '',
			allocationBand: c.allocationBand || '',
			caseLevel: c.allocationLevel || '',
			siteAddressPostcode: c.siteAddressPostcode || '',
			siteAddressLatitude: c.siteAddressLatitude,
			siteAddressLongitude: c.siteAddressLongitude,
			lpaName: c.lpaName || '',
			lpaRegion: c.lpaRegion || '',
			caseStatus: c.caseStatus || 'Unassigned',
			caseAge: this.getCaseAgeInWeeks(c.caseValidDate || new Date()),
			linkedCases: this.getLinkedCasesCount(c),
			caseReceivedDate: c.caseCreatedDate || null,
			finalCommentsDate: c.finalCommentsDueDate || new Date(),
			specialisms: c.Specialisms,
			specialismList: c.Specialisms ? c.Specialisms.map((s) => s.name).join(', ') : 'None'
		};
	}

	/**
	 * Returns the number of linked appeals for a case.
	 * @param {import('@pins/inspector-programming-database/src/client').AppealCase} c
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
}
