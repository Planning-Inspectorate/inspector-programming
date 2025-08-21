import { addSessionData, clearSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { assignCasesToInspector } from '../../case/case.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildPostCases(service) {
	return async (req, res) => {
		let selectedCases = [];

		if (req.body.selectedCases) {
			selectedCases = Array.isArray(req.body.selectedCases) ? req.body.selectedCases : [req.body.selectedCases];
		}

		const failedCases = await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCases);

		let updateCasesResult = {};
		if (failedCases.length > 0) {
			updateCasesResult = {
				errorMessage: 'Unable to update case, please try again. If it does not work, please contact the support team.'
			};
			addSessionData(req, 'caseListData', updateCasesResult, 'persistence');
		} else {
			clearSessionData(req, 'caseListData', ['errorMessage'], 'persistence');
		}

		const redirectUrl = `/?inspectorId=${req.body.inspectorId}`;

		return res.redirect(redirectUrl);
	};
}
