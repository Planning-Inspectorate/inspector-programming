/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} db
 * @param {string} caseId
 * @returns {Promise<import('./types').CaseWithEventsAndSpecialisms | null>}
 */
export async function getCaseDetails(db, caseId) {
	if (!caseId) {
		return null;
	}
	return db.appealCase.findUnique({
		where: { caseReference: caseId },
		include: { Events: true, Specialisms: true }
	});
}

/**
 * Assigns cases to inspector
 * Returns case ids that failed to be updated
 * @param {import('../auth/session.service').SessionWithAuth} session
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string[]} caseIds
 * @returns {Promise<string[]>}
 */
export async function assignCasesToInspector(session, service, inspectorId, caseIds) {
	if (inspectorId == null || inspectorId == '') {
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
			service.logger.error(error, 'Failed to update case');
			failedCases.push(caseId);
		}
	}

	return failedCases;
}

/**
 * @param {string[]} caseIds
 * @param {import('#service').WebService} service
 * @returns {Promise<string[]>}
 */
export async function getCaseAndLinkedCasesIds(caseIds, service) {
	for (const caseId of caseIds) {
		const appeal = await service.casesClient.getCaseById(caseId);
		if (appeal.linkedCaseStatus == 'parent') {
			const linkedCasesIds = await getLinkedCaseIdsOfParentId(caseId, service);
			caseIds = caseIds.concat(linkedCasesIds);
		}
	}

	return caseIds;
}

/**
 *
 * @param {string} parentId
 * @param {import('#service').WebService} service
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
