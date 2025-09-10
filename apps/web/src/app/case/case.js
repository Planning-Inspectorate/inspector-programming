/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} db
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
 * Returns case ids that failed to be updated
 * @param {import('../auth/session.service').SessionWithAuth} session
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {number[]} caseIds
 * @returns {Promise<number[]>}
 */
export async function assignCasesToInspector(session, service, inspectorId, caseIds) {
	if (!inspectorId || inspectorId == '') {
		service.logger.warn('No inspector selected');
		return caseIds;
	}

	const cbosApiClient = service.getCbosApiClientForSession(session);
	const appealPatchData = { inspector: inspectorId };

	let failedCases = [];

	for (let caseId of caseIds) {
		try {
			await cbosApiClient.patchAppeal(caseId, appealPatchData);
		} catch (error) {
			service.logger.error(error, `Failed to update case ${caseId} for inspector ${inspectorId}`);
			failedCases.push(caseId);
		}
	}

	return failedCases;
}

/**
 * @param {number[]} caseIds
 * @param {import('#service').WebService} service
 * @returns {Promise<number[]>}
 */
export async function getCaseAndLinkedCasesIds(caseIds, service) {
	for (const caseId of caseIds) {
		const appeal = await service.casesClient.getCaseById(caseId);
		const caseReference = appeal.caseReference;
		if (appeal && caseReference && appeal.linkedCaseStatus == 'Parent') {
			const linkedCasesIds = await getLinkedCaseIdsOfParentId(caseReference, service);
			caseIds = caseIds.concat(linkedCasesIds);
		}
	}

	return caseIds;
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
