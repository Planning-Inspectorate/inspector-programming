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
	async getAllCases({ limit = 10, offset = 0 }) {
		const cases = await this.#client.appealCase.findMany({
			orderBy: { caseValidDate: 'asc' }, // oldest first
			skip: offset,
			take: limit
		});
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
			lpaName: c.lpaName || '',
			lpaRegion: c.lpaRegion || '',
			caseStatus: c.caseStatus || 'Unassigned',
			caseAge: this.getCaseAgeInWeeks(c.caseValidDate || new Date()),
			linkedCases: this.getLinkedCasesCount(c),
			finalCommentsDate: c.finalCommentsDueDate || new Date()
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
}
