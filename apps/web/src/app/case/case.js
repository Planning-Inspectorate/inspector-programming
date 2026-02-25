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
		include: { Events: true, Specialisms: true, ChildCases: { select: { caseReference: true } } }
	});
}

/**
 * Assigns cases to inspector
 * Returns case references that failed to be updated or already assigned
 * @param {import('../auth/session.service').SessionWithAuth} session
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {number[]} caseIds
 * @param {string[]} caseReferences
 * @returns {Promise<{failedCaseReferences: (string | undefined)[], failedCaseIds: (number | undefined)[], alreadyAssignedCaseReferences: (string | undefined)[], successfullyAssignedCaseReferences: (string | undefined)[]}>}
 */
export async function assignCasesToInspector(session, service, inspectorId, caseIds, caseReferences) {
	const cbosApiClient = service.getCbosApiClientForSession(session);
	const appealPatchData = { inspectorId: inspectorId };

	/**
	 * @type {import("@pins/inspector-programming-lib/data/types").CbosSingleAppealResponse[]}
	 */
	let appeals = [];

	try {
		// Get latest data from cbos
		appeals = await cbosApiClient.fetchAppealDetailsByReference(caseReferences);
	} catch (error) {
		service.logger.error(error, `Failed to fetch case details for case details`);
		return {
			failedCaseReferences: [],
			failedCaseIds: caseIds,
			alreadyAssignedCaseReferences: [],
			successfullyAssignedCaseReferences: []
		};
	}

	const assignedCases = appeals.filter((appeal) => appeal.inspector);
	const alreadyAssignedCaseReferences = assignedCases.map((appeal) => appeal.appealReference);
	const unassignedCases = appeals.filter((appeal) => !appeal.inspector);
	const failedCaseReferences = [];
	const failedCaseIds = [];
	const successfullyAssignedCaseReferences = [];

	// Process unassigned cases only - assign them to inspector
	for (let appeal of unassignedCases) {
		try {
			if (!appeal.appealId) throw new Error('appealId is undefined');
			if (!appeal.appealReference) throw new Error('appealReference is undefined');
			await cbosApiClient.patchAppeal(appeal.appealId, appealPatchData);
			successfullyAssignedCaseReferences.push(appeal.appealReference);
			service.logger.info(`Successfully assigned case ${appeal.appealReference} to inspector ${inspectorId}`);
		} catch (error) {
			service.logger.error(
				error,
				`Failed to update case (appealId: ${appeal.appealId}, appealReference: ${appeal.appealReference}) for inspector ${inspectorId}`
			);
			failedCaseReferences.push(appeal.appealReference);
			failedCaseIds.push(appeal.appealId);
		}
	}

	return { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences, successfullyAssignedCaseReferences };
}

/**
 * @param {number[]} caseIds
 * @param {import('#service').WebService} service
 * @returns {Promise<{cases: import('./types.d.ts').CaseToAssign[], caseIds: number[]}>}
 */
export async function getCaseAndLinkedCasesIds(caseIds, service) {
	const casesById = new Map();

	for (const caseId of caseIds) {
		const appeal = await service.casesClient.getCaseById(caseId);
		if (!appeal) continue;

		if (!casesById.has(caseId)) {
			casesById.set(caseId, mapCaseViewModelToCaseToAssign(appeal, true));
		}

		if (appeal.linkedCaseStatus === 'Parent') {
			const linkedCaseIds = await getLinkedCaseIdsOfParentId(appeal.caseReference, service);
			for (const linkedCaseId of linkedCaseIds) {
				if (casesById.has(linkedCaseId)) continue;
				const linkedAppeal = await service.casesClient.getCaseById(linkedCaseId);
				if (linkedAppeal) {
					casesById.set(linkedCaseId, mapCaseViewModelToCaseToAssign(linkedAppeal, false));
				}
			}
		}
	}

	const cases = Array.from(casesById.values());
	return { cases, caseIds: [...casesById.keys()] };
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.d.ts').CaseViewModel} caseViewModel
 * @param {boolean} isParent
 * @returns {import('./types.d.ts').CaseToAssign}
 */
function mapCaseViewModelToCaseToAssign(caseViewModel, isParent) {
	return {
		caseId: caseViewModel.caseId,
		caseReference: caseViewModel.caseReference,
		caseProcedure: caseViewModel.caseProcedure,
		caseType: caseViewModel.caseType,
		caseLevel: caseViewModel.caseLevel,
		lpaName: caseViewModel.lpaName,
		siteAddressPostcode: caseViewModel.siteAddressPostcode,
		isParent
	};
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
