import { caseViewModel } from '../home/controller.js';

export function buildViewCase(service) {
	return async (req, res) => {
		const mapsKey = service.maps.key;
		const caseData = null;
		const inspectors = [];
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
