/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} db
 * @param {string} caseReference
 * @returns {Promise<import('./types').CaseWithEventsAndSpecialisms | null>}
 */
export async function getCaseDetails(db, caseReference) {
	if (!caseReference) {
		return null;
	}
	return db.appealCase.findUnique({
		where: { caseReference: caseReference },
		include: { Events: true, Specialisms: true }
	});
}

/**
 * Assigns cases to inspector
 * Returns case references that failed to be updated or already assigned
 * @param {import('../auth/session.service').SessionWithAuth} session
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {number[]} caseIds
 * @returns {Promise<{failedCaseReferences: (string | undefined)[], failedCaseIds: (number | undefined)[], alreadyAssignedCaseReferences: (string | undefined)[]}>}
 */
export async function assignCasesToInspector(session, service, inspectorId, caseIds) {
	const cbosApiClient = service.getCbosApiClientForSession(session);
	const appealPatchData = { inspector: inspectorId };

	/**
	 * @type {import("@pins/inspector-programming-lib/data/types").CbosSingleAppealResponse[]}
	 */
	let appeals = [];

	try {
		// Get latest data from cbos
		const res = await cbosApiClient.fetchAppealDetails(caseIds);
		if (Object.keys(res.failures).length > 0) {
			service.logger.error(`${Object.keys(res.failures).join(',')} cases failed to fetch`);
			return { failedCaseReferences: [], failedCaseIds: caseIds, alreadyAssignedCaseReferences: [] };
		}
		appeals = res.details;
	} catch (error) {
		service.logger.error(error, `Failed to fetch case details for case details`);
		return { failedCaseReferences: [], failedCaseIds: caseIds, alreadyAssignedCaseReferences: [] };
	}

	const assignedCases = appeals.filter((appeal) => appeal.inspector);
	const alreadyAssignedCaseReferences = assignedCases.map((appeal) => appeal.appealReference);
	const failedCaseReferences = [];
	const failedCaseIds = [];

	if (alreadyAssignedCaseReferences.length === 0) {
		for (let appeal of appeals) {
			try {
				if (!appeal.appealId) throw new Error('appealId is undefined');
				if (!appeal.appealReference) throw new Error('appealReference is undefined');
				await cbosApiClient.patchAppeal(appeal.appealId, appealPatchData);
			} catch (error) {
				service.logger.error(
					error,
					`Failed to update case (appealId: ${appeal.appealId}, appealReference: ${appeal.appealReference}) for inspector ${inspectorId}`
				);
				failedCaseReferences.push(appeal.appealReference);
				failedCaseIds.push(appeal.appealId);
			}
		}
	}

	return { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences };
}

/**
 * @typedef {Object} CaseItem
 * @property {string | number} caseId
 * @property {string} caseReference
 * @property {boolean} isParent
 */

/**
 * @param {number[]} caseIds
 * @param {import('#service').WebService} service
 * @returns {Promise<{cases: CaseItem[], caseIds: number[]}>}
 */
export async function getCaseAndLinkedCasesIds(caseIds, service) {
	const casesById = new Map();

	for (const caseId of caseIds) {
		const appeal = await service.casesClient.getCaseById(caseId);
		if (!appeal) continue;

		if (!casesById.has(caseId)) {
			casesById.set(caseId, {
				caseId: appeal.caseId,
				caseReference: appeal.caseReference,
				isParent: true
			});
		}

		if (appeal.linkedCaseStatus === 'Parent') {
			const linkedCaseIds = await getLinkedCaseIdsOfParentId(appeal.caseReference, service);
			for (const linkedCaseId of linkedCaseIds) {
				if (casesById.has(linkedCaseId)) continue;
				const linkedAppeal = await service.casesClient.getCaseById(linkedCaseId);
				if (linkedAppeal) {
					casesById.set(linkedCaseId, {
						caseId: linkedAppeal.caseId,
						caseReference: linkedAppeal.caseReference,
						isParent: false
					});
				}
			}
		}
	}

	const cases = Array.from(casesById.values());
	return { cases, caseIds: [...casesById.keys()] };
}

/**
 *
 * @param {string} parentId
 * @param {import('#service').WebService} service
 * @returns {Promise<number[]>}
 */
export async function getLinkedCaseIdsOfParentId(parentId, service) {
	const caseIds = [];
	const linkedCases = await service.casesClient.getLinkedCasesByParentCaseId(parentId);
	for (const linkedCase of linkedCases) {
		if (linkedCase.caseId) {
			caseIds.push(linkedCase.caseId);
		}
	}

	return caseIds;
}
