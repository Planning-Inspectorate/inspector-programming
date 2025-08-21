import { assignCasesToInspector } from '../../case/case.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildPostCases(service) {
	return async (req, res) => {
		let selectedCases = Array.isArray(req.body.selectedCases) ? req.body.selectedCases : [req.body.selectedCases];

		await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCases);
		const redirectUrl = `/?inspectorId=${req.body.inspectorId}`;
		return res.redirect(redirectUrl);
	};
}
