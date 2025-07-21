import { caseViewModel } from '../home/controller.js';
import { getSortedInspectorList, getInspectorById } from '../../inspector/inspector.js';
import { checkAccountGroupAccess, getAccountId } from '#util/account.js';

/**
 * @param {import('#service').App2Service} service
 * @returns {import('express').Handler}
 */
export function buildViewCase(service) {
	return async (req, res) => {
		/**
		 * @type {(import("../../inspector/types.js").Inspector)[]}
		 */
		let inspectors = [];

		if (
			checkAccountGroupAccess(req.session, service.entraGroupIds.teamLeads) ||
			checkAccountGroupAccess(req.session, service.entraGroupIds.nationalTeam)
		) {
			inspectors = await getSortedInspectorList(
				service.entraClient,
				req.session,
				service.logger,
				service.entraGroupIds.inspectors
			);
		} else if (checkAccountGroupAccess(req.session, service.entraGroupIds.inspectors)) {
			let inspector = await getInspectorById(
				service.entraClient,
				req.session,
				service.logger,
				service.entraGroupIds.inspectors,
				getAccountId(req.session)
			);
			if (inspector) {
				inspectors.push(inspector);
			}
		}

		const mapsKey = service.maps.key;
		const caseData = null;
		const inspectorId = req.query.inspectorId;
		const inspectorLatLong = null;

		return res.render('views/case/view.njk', {
			caseData,
			inspectors,
			inspectorId,
			apiKey: mapsKey,
			inspectorLatLong,
			pins: [caseViewModel(caseData)],
			containerClasses: 'pins-container-wide',
			title: 'Case details',
			inspectorPin: {
				id: null,
				homeLatLong: null,
				firstName: null,
				lastName: null,
				address: null,
				grade: null,
				fte: null,
				caseSpecialisms: null
			}
		});
	};
}
