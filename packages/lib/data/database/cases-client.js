/**
 * Client for fetching case data from the Prisma database for the application,
 *
 * @module CasesClient
 */
export class CasesClient {
	/** @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} */
	#client;

	/**
	 *
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 * Immediately converts to CaseViewModel type
	 *
	 * @returns {Promise<import('../types').CaseViewModel[]>}
	 */
	async getAllCases() {
		const timingRules = await this.#client.calendarEventTimingRule.findMany({
			select: { caseType: true, caseProcedure: true, allocationLevel: true }
		});
		if (!timingRules.length) {
			return [];
		}

		const cases = await this.#client.appealCase.findMany({
			where: {
				OR: timingRules.map((rule) => ({
					caseType: rule.caseType,
					caseProcedure: rule.caseProcedure,
					allocationLevel: rule.allocationLevel
				}))
			},
			include: {
				ChildCases: true,
				Specialisms: true,
				Lpa: {
					include: {
						LpaRegion: {
							include: {
								LpaRegionName: true
							}
						}
					}
				}
			}
		});
		return cases.map((c) => this.caseToViewModel(c));
	}

	/**
	 * Maps a case object to a view model for UI consumption.
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.AppealCaseGetPayload<{ include: { ChildCases: true, Specialisms: true } }>} c
	 * @returns {import('../types').CaseViewModel}
	 */
	caseToViewModel(c) {
		return {
			caseReference: c.caseReference,
			caseId: c.caseId,
			caseType: c.caseType || '',
			caseProcedure: c.caseProcedure || '',
			allocationBand: c.allocationBand || '',
			caseLevel: c.allocationLevel || '',
			siteAddressPostcode: c.siteAddressPostcode || '',
			siteAddressLatitude: Number(c.siteAddressLatitude),
			siteAddressLongitude: Number(c.siteAddressLongitude),
			lpaName: c.lpaName || '',
			lpaRegion: c.Lpa ? c.Lpa?.LpaRegion?.LpaRegionName?.name : '',
			caseStatus: c.caseStatus || 'Unassigned',
			caseAge: this.getCaseAgeInWeeks(c.caseValidDate || new Date()),
			linkedCaseReferences: this.getLinkedCaseReferences(c),
			linkedCaseStatus: c.linkedCaseStatus,
			caseReceivedDate: c.caseCreatedDate || null,
			finalCommentsDate: c.finalCommentsDueDate || new Date(),
			specialisms: c.Specialisms,
			specialismList: c.Specialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
			leadCaseReference: c.leadCaseReference || null
		};
	}

	/**
	 * Returns the case references of the linked cases (both child and lead).
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.AppealCaseGetPayload<{ include: { ChildCases: true, Specialisms: true } }>} c
	 * @returns {string[]}
	 */
	getLinkedCaseReferences(c) {
		const references = [];
		if (c.ChildCases && c.ChildCases.length > 0) {
			references.push(...c.ChildCases.map((child) => child.caseReference));
		}
		if (c.leadCaseReference) {
			references.push(c.leadCaseReference);
		}
		return references;
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
		const diffMs = +now - +startDate;
		return diffMs < 0 ? 0 : Math.round(diffMs / msPerWeek);
	}

	/**
	 * Fetch a paginated list of appeal cases from the database.
	 *
	 * @param {import('../types').CaseViewModel[]} allCases - All cases pre-pagination
	 * @param {number} page - The current page number (1-based).
	 * @param {number} pageSize - The number of cases per page.
	 * @returns {Promise<{ cases: import('../types').CaseViewModel[], total: number }>}
	 */
	async paginateCases(allCases, page = 1, pageSize = 10) {
		const skip = (page - 1) * pageSize;

		const cases = allCases.slice(skip, skip + pageSize);

		return {
			cases: cases,
			total: allCases.length || 0
		};
	}

	/**
	 *
	 * @param {number[]} caseIds
	 */
	async deleteCases(caseIds) {
		await this.#client.appealCase.deleteMany({
			where: {
				caseId: {
					in: caseIds
				}
			}
		});
	}

	/**
	 * Returns when the latest cases update was
	 *
	 * @returns {Promise<Date|null>}
	 */
	async lastCasesUpdate() {
		const latestPoll = await this.#client.appealCasePollStatus.findFirst({
			orderBy: {
				lastPollAt: 'desc'
			}
		});
		if (latestPoll) {
			return latestPoll.lastPollAt;
		}
		return null;
	}
}
