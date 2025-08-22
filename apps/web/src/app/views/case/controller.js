import { caseViewModel } from '../home/controller.js';
import { getInspectorList } from '../../inspector/inspector.js';
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';
/**
 * @param {import('#service').App2Service} service
 * @returns {import('express').Handler}
 */
export function buildViewCase(service) {
	return async (req, res) => {
		const mapsKey = service.osMapsApiKey;

		// Inspector
		const inspectorId = req.query.inspectorId ?? undefined;
		const inspectors = await getInspectorList(service, req.session);
		let inspectorData = null;
		let inspectorPin = null;
		let inspectorLatLong = null;
		try {
			if (inspectorId) {
				inspectorData = await service.db.inspector.findFirst({
					where: { id: inspectorId },
					include: {
						Specialisms: true
					}
				});
				if (inspectorData) {
					inspectorPin = {
						id: inspectorData?.id,
						latitude: inspectorData?.latitude,
						longitude: inspectorData?.longitude,
						firstName: inspectorData?.firstName,
						lastName: inspectorData?.lastName,
						address: inspectorData?.email_address,
						grade: inspectorData?.grade,
						fte: inspectorData?.fte,
						caseSpecialisms: inspectorData.Specialisms
							? inspectorData.Specialisms?.map((s) => s.name).join(', ')
							: 'None'
					};
					inspectorLatLong = {
						latitude: inspectorData?.latitude,
						longitude: inspectorData?.longitude
					};
				}
			}
		} catch (error) {
			service.logger.error(error, `Failed to fetch inspector: ${inspectorId}`);
		}

		// Case
		let caseData = null;
		try {
			caseData = await service.db.appealCase.findUnique({
				where: { caseReference: req.params.caseId },
				include: {
					Events: true,
					Specialisms: true
				}
			});
		} catch (error) {
			service.logger.error(error, `Failed to fetch case: ${req.params.caseId}`);
		}

		return res.render('views/case/view.njk', {
			caseData: caseDetailsViewModel(caseData),
			inspectors,
			inspectorId,
			apiKey: mapsKey,
			inspectorLatLong,
			pins: [caseViewModel(caseData)],
			containerClasses: 'pins-container-wide',
			title: 'Case',
			pageHeading: 'Case details',
			inspectorPin
		});
	};
}

export function caseDetailsViewModel(c) {
	return {
		...c,
		caseReference: c.caseReference,
		caseStartedDate: c.caseCreatedDate,
		caseSpecialisms: c.Specialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		eventType: c.Events.length > 0 ? c.Events[0].eventType : 'No events',
		appealStartDate: formatDateForDisplay(c.caseCreatedDate, { format: 'dd/MM/yyyy' })
	};
}
