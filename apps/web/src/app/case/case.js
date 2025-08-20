/**
 *
 * @param {import('../auth/session.service').SessionWithAuth} session
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string[]} caseIds
 */
export async function assignCasesToInspector(session, service, inspectorId, caseIds) {
	if (inspectorId == null || inspectorId == '') {
		service.logger.warn('No inspector selected');
		return;
	}

	const cbosApiClient = service.getCbosApiClientForSession(session);
	const appealPatchData = { inspector: inspectorId };

	for (let caseId of caseIds) {
		try {
			await cbosApiClient.patchAppeal(caseId, appealPatchData);
		} catch (error) {
			service.logger.error(error, 'Failed to update case');
		}
	}
}
