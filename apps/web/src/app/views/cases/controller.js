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
				selectedCases: failedCases
			};

			addSessionData(req, 'caseListData', updateCasesResult, 'persistence');

			const viewData =
				failedCases.length == selectedCases.length
					? {
							bodyCopy: 'Try again later. The following cases were not assigned.',
							failedCases: failedCases
						}
					: {};

			return res.render('views/errors/500.njk', viewData);
		}

		clearSessionData(req, 'caseListData', ['selectedCases'], 'persistence');

		const redirectUrl = `/?inspectorId=${req.body.inspectorId}`;

		return res.redirect(redirectUrl);
	};
}
