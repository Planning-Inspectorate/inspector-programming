import { getCaseDetails } from '../../case/case.js';
import { toInspectorViewModel } from '../home/view-model.js';
import { getInspectorDetails } from '../../inspector/inspector.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewCase(service) {
	return async (req, res) => {
		/** @type {string} */
		const inspectorId = String(req.query.inspectorId);
		const inspectorData = await getInspectorDetails(service.db, inspectorId);

		/** @type {string} */
		const caseId = String(req.params.caseId);
		const caseData = await getCaseDetails(service.db, caseId);

		/** @type {import('../../case/types.d.ts').CasePageViewModel} */
		const viewModel = {
			pageHeading: 'Case details',
			containerClasses: 'pins-container-wide',
			title: 'Case',
			map: {
				apiKey: service.osMapsApiKey
			},
			inspectorPin: toInspectorViewModel(inspectorData),
			caseData: service.casesClient.caseToViewModel(caseData)
		};

		return res.render('views/case/view.njk', viewModel);
	};
}
